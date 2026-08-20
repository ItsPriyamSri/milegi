#!/usr/bin/env bash
# End-to-end pipeline check with curl only: OTR -> form -> lock -> institute -> university -> DWO
# -> correction -> sanction -> PFMS failure -> fix -> paid. Every step asserts on the response body.
set -uo pipefail

BASE="${BASE:-http://localhost:3000}"
STU=$(mktemp); INST=$(mktemp); DWO=$(mktemp)
trap 'rm -f "$STU" "$INST" "$DWO"' EXIT
STEP=0

say() { STEP=$((STEP + 1)); printf '\n[%02d] %s\n' "$STEP" "$1"; }
die() { printf '\nSMOKE FAILED at step %s: %s\nresponse: %s\n' "$STEP" "$1" "${2:-}" >&2; exit 1; }

post() { curl -sS -X POST -H 'content-type: application/json' "$@"; }

say "reset the store and the simulator clock"
R=$(post "$BASE/api/sim/reset")
echo "$R" | jq -e '.ok == true' >/dev/null || die "reset failed" "$R"

say "request a mock OTP"
R=$(post -c "$STU" -d '{"mobile":"9876500001"}' "$BASE/api/auth/otp")
OTP=$(echo "$R" | jq -r '.data.otpDemo')
[ -n "$OTP" ] && [ "$OTP" != "null" ] || die "no OTP returned" "$R"

say "verify the OTP and open a student session"
R=$(post -b "$STU" -c "$STU" -d "{\"mobile\":\"9876500001\",\"otp\":\"$OTP\"}" "$BASE/api/auth/verify")
echo "$R" | jq -e '.ok == true' >/dev/null || die "otp verify failed" "$R"

say "reject a real-looking Aadhaar number"
R=$(post -b "$STU" -d '{"aadhaarDemo":"234512340001","mobile":"9876500001","dob":"2006-04-11","category":"obc","nameHi":"अंकित सिंह","fatherNameHi":"राम सिंह","motherNameHi":"सीता देवी","districtCode":"70","addressHi":"कानपुर","gender":"m"}' "$BASE/api/otr")
echo "$R" | jq -e '.error.code == "AADHAAR_NOT_DEMO"' >/dev/null || die "a non-demo Aadhaar was accepted" "$R"

say "mint an OTR with a demo Aadhaar"
R=$(post -b "$STU" -c "$STU" -d '{"aadhaarDemo":"000012340002","mobile":"9876500001","dob":"2006-04-11","category":"obc","nameHi":"अंकित सिंह","fatherNameHi":"राम सिंह","motherNameHi":"सीता देवी","districtCode":"70","addressHi":"कानपुर","gender":"m"}' "$BASE/api/otr")
OTR=$(echo "$R" | jq -r '.data.profile.otr')
echo "$OTR" | grep -qE '^UP26-[0-9]{10}$' || die "bad OTR shape" "$R"

say "mint again on the same Aadhaar — must recover, not debar"
R=$(post -b "$STU" -d '{"aadhaarDemo":"000012340002","mobile":"9876500001","dob":"2006-04-11","category":"obc","nameHi":"अंकित सिंह","fatherNameHi":"राम सिंह","motherNameHi":"सीता देवी","districtCode":"70","addressHi":"कानपुर","gender":"m"}' "$BASE/api/otr")
echo "$R" | jq -e '.data.duplicate == true and .data.profile.otr == "'"$OTR"'"' >/dev/null || die "duplicate OTR was not recovered" "$R"

say "route three answers, with \"don't know\" resolving to the safe side"
R=$(post -d '{"studying":"college","firstYear":false,"gotLastYear":"dunno","changedCourse":false,"rejectedLastYear":false,"inUp":true}' "$BASE/api/route")
echo "$R" | jq -e '.data.track == "dashmottar" and .data.cycle == "renewal" and (.data.recoveryHi | length) > 10' >/dev/null || die "router did not resolve" "$R"

say "create the case"
R=$(post -b "$STU" -d '{"track":"dashmottar","cycle":"renewal","instituteId":"inst-csjmu-arts","courseCode":"BSC"}' "$BASE/api/cases")
CASE=$(echo "$R" | jq -r '.data.case.id')
echo "$CASE" | grep -qE '^MLG-26-[0-9]{6}$' || die "no case id" "$R"
echo "$R" | jq -e '.data.case.fee.nonRefundable == 19800' >/dev/null || die "fee did not come from master data" "$R"

say "an unpublished course cannot start a case"
R=$(post -b "$STU" -d '{"track":"dashmottar","cycle":"fresh","instituteId":"inst-csjmu-arts","courseCode":"BED"}' "$BASE/api/cases")
echo "$R" | jq -e '.ok == false' >/dev/null || die "an unpublished course was accepted" "$R"

say "the draft rejects a CGPA in the marks-total field and any money field"
R=$(curl -sS -X PATCH -b "$STU" -H 'content-type: application/json' -d '{"marksTotal":10,"nonRefundable":1}' "$BASE/api/cases/$CASE/draft")
echo "$R" | jq -e '.data.rejected | index("marksTotal") != null and index("nonRefundable") != null' >/dev/null || die "patch whitelist leaked" "$R"

say "fill the form"
R=$(curl -sS -X PATCH -b "$STU" -H 'content-type: application/json' -d '{"courseType":"regular","yearOfStudy":2,"admissionDate":"2026-07-20","boardName":"upmsp","boardRollNo":"2404771201","enrolmentNo":"CSJM2426BA0917","resultStatus":"passed","marksObtained":410,"marksTotal":600,"semesterCombined":true,"annualIncome":96000,"rationCard":"0","declAttendance":true,"declNoOtherScholarship":true,"declTruthful":true}' "$BASE/api/cases/$CASE/draft")
echo "$R" | jq -e '.data.rejected == []' >/dev/null || die "valid fields were rejected" "$R"

say "e-District down: the certificate check reports unknown, never a fake pass"
post -d '{"system":"edistrict","health":"down"}' "$BASE/api/sim/config" >/dev/null
R=$(post -b "$STU" -d '{"kind":"income","applicationNo":"APP-2024-771201","certNo":"IC-2024-771201"}' "$BASE/api/cases/$CASE/verify-certificate")
echo "$R" | jq -e '.error.code == "UPSTREAM_DOWN" and .error.retryable == true' >/dev/null || die "a downed upstream did not surface" "$R"
post -d '{"system":"edistrict","health":"up"}' "$BASE/api/sim/config" >/dev/null

say "verify an expired income certificate — must block the lock"
R=$(post -b "$STU" -d '{"kind":"income","applicationNo":"APP-2021-330077","certNo":"IC-2021-330077"}' "$BASE/api/cases/$CASE/verify-certificate")
echo "$R" | jq -e '[.data.case.preflight[] | select(.id == "income_certificate")][0].state == "blocked"' >/dev/null || die "an expired certificate did not block" "$R"
R=$(post -b "$STU" "$BASE/api/cases/$CASE/lock")
echo "$R" | jq -e '.error.code == "PREFLIGHT_BLOCKED"' >/dev/null || die "lock ignored a blocker" "$R"

say "verify the valid certificates"
post -b "$STU" -d '{"kind":"income","applicationNo":"APP-2024-771201","certNo":"IC-2024-771201"}' "$BASE/api/cases/$CASE/verify-certificate" >/dev/null
R=$(post -b "$STU" -d '{"kind":"caste","applicationNo":"APP-2019-118834","certNo":"CC-2019-118834"}' "$BASE/api/cases/$CASE/verify-certificate")
echo "$R" | jq -e '[.data.case.preflight[] | select(.state == "blocked")] | length == 0' >/dev/null || die "blockers remain" "$R"

say "unseeded bank account warns without blocking"
R=$(curl -sS -b "$STU" "$BASE/api/cases/$CASE")
echo "$R" | jq -e '[.data.case.preflight[] | select(.id == "dbt_seeding")][0].state == "warn"' >/dev/null || die "DBT seeding state wrong" "$R"

say "lock the application"
R=$(post -b "$STU" "$BASE/api/cases/$CASE/lock")
REG=$(echo "$R" | jq -r '.data.case.registrationNo')
echo "$REG" | grep -qE '^[0-9]{15}$' || die "registration number not minted" "$R"
echo "$R" | jq -e '.data.case.stage == "institute_review" and .data.case.hardCopy.dueAt != null' >/dev/null || die "lock did not start the hard-copy clock" "$R"

say "the public tracking view carries no form data"
R=$(curl -sS "$BASE/api/track/$CASE")
echo "$R" | jq -e '.data.case.form == null and (.data.case.stageHi | length) > 0' >/dev/null || die "tracking view leaked data" "$R"

say "institute login"
R=$(post -c "$INST" -d '{"role":"institute","code":"inst-csjmu-arts","pin":"1234"}' "$BASE/api/auth/operator")
echo "$R" | jq -e '.ok == true' >/dev/null || die "institute login failed" "$R"

say "forwarding without paper is refused"
R=$(post -b "$INST" "$BASE/api/institute/cases/$CASE/forward")
echo "$R" | jq -e '.error.code == "HARDCOPY_MISSING"' >/dev/null || die "forwarded without the hard copy" "$R"

say "record the hard copy, then attendance below the rule"
post -b "$INST" "$BASE/api/institute/cases/$CASE/hardcopy" >/dev/null
post -b "$INST" -d '{"percent":68}' "$BASE/api/institute/cases/$CASE/attendance" >/dev/null
R=$(post -b "$INST" "$BASE/api/institute/cases/$CASE/forward")
echo "$R" | jq -e '.error.code == "ATTENDANCE_LOW"' >/dev/null || die "forwarded below 75% attendance" "$R"

say "fix attendance and forward"
post -b "$INST" -d '{"percent":86}' "$BASE/api/institute/cases/$CASE/attendance" >/dev/null
R=$(post -b "$INST" "$BASE/api/institute/cases/$CASE/forward")
echo "$R" | jq -e '.data.case.stage == "university_scrutiny"' >/dev/null || die "did not reach university scrutiny" "$R"

say "advance 20 days: the university step auto-advances and breaches escalate"
R=$(post -d '{"days":20}' "$BASE/api/sim/advance")
echo "$R" | jq -e '.data.report.autoAdvanced | index("'"$CASE"'") != null' >/dev/null || die "no auto-advance" "$R"

say "the case file shows an owner, a clock and an outbox"
R=$(curl -sS "$BASE/api/track/$CASE")
echo "$R" | jq -e '.data.case.stage == "dwo_review" and .data.case.owner.nameHi != null and .data.case.dueAt != null' >/dev/null || die "case file lost its owner or clock" "$R"

say "DWO login and cross-check"
post -c "$DWO" -d '{"role":"dwo","code":"70","pin":"1234"}' "$BASE/api/auth/operator" >/dev/null
R=$(post -b "$DWO" "$BASE/api/dwo/cases/$CASE/crosscheck")
echo "$R" | jq -e '[.data.checks[] | select(.matched == false)] | length == 0' >/dev/null || die "cross-check found a mismatch it should not" "$R"

say "flag an enrolment mismatch, then check the correction window is dated"
R=$(post -b "$DWO" -d '{"codes":["ENROLMENT_MISMATCH"],"note":""}' "$BASE/api/dwo/cases/$CASE/flag")
echo "$R" | jq -e '.data.case.stage == "correction_required" and .data.case.correction.openAt != null' >/dev/null || die "flag did not open a correction window" "$R"

say "correction accepts only the unlocked field"
R=$(curl -sS -X PATCH -b "$STU" -H 'content-type: application/json' -d '{"enrolmentNo":"CSJM2426BS1188","hosteller":true}' "$BASE/api/cases/$CASE/draft")
echo "$R" | jq -e '.data.rejected == ["hosteller"]' >/dev/null || die "correction window opened the wrong fields" "$R"

say "resubmit, verify, sanction"
post -b "$STU" "$BASE/api/cases/$CASE/resubmit" >/dev/null
R=$(post -b "$DWO" "$BASE/api/dwo/cases/$CASE/verify")
echo "$R" | jq -e '.data.case.stage == "sanctioned"' >/dev/null || die "verify failed" "$R"
R=$(post -b "$DWO" -d "{\"caseIds\":[\"$CASE\"]}" "$BASE/api/dwo/sanction")
echo "$R" | jq -e '.data.sanctioned | index("'"$CASE"'") != null' >/dev/null || die "sanction batch failed" "$R"

say "run PFMS: this student's account is not DBT-seeded, so the payment must bounce"
R=$(post "$BASE/api/sim/pfms")
echo "$R" | jq -e '.data.rows[0].status == "rejected_not_seeded" and .data.rows[0].failureCode == "NPCI_NOT_SEEDED"' >/dev/null || die "payment did not bounce as expected" "$R"
R=$(curl -sS "$BASE/api/track/$CASE")
echo "$R" | jq -e '.data.case.stage == "payment_failed" and ([.data.case.alerts[] | select(.kind == "payment_action_needed")] | length == 1)' >/dev/null || die "no actionable payment alert" "$R"

say "the student fixes DBT seeding at the bank, then the payment is requeued (not re-sanctioned)"
post -d '{"forcedPfmsOutcome":"credited"}' "$BASE/api/sim/config" >/dev/null
R=$(post -b "$STU" "$BASE/api/cases/$CASE/retry-payment")
echo "$R" | jq -e '.data.case.stage == "pfms_processing"' >/dev/null || die "requeue failed" "$R"
R=$(curl -sS -X POST "$BASE/api/sim/pfms")
echo "$R" | jq -e '.data.rows[0].status == "credited"' >/dev/null || die "forced credit did not apply" "$R"

say "the grievance draft names the case, the owner and the wait"
R=$(post -b "$STU" "$BASE/api/cases/$CASE/grievance")
echo "$R" | jq -e '.data.draft.bodyHi | contains("'"$CASE"'")' >/dev/null || die "grievance draft missing the case id" "$R"

R=$(curl -sS "$BASE/api/track/$CASE")
STAGE=$(echo "$R" | jq -r '.data.case.stage')
[ "$STAGE" = "paid" ] || die "final stage was $STAGE, expected paid" "$R"

printf '\nSMOKE OK — case %s reached paid (registration %s, OTR %s)\n' "$CASE" "$REG" "$OTR"
