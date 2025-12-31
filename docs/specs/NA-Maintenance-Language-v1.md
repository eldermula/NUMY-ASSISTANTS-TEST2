# NA Maintenance Language v1 (Obfuscation Codebook)

## Purpose
A human/robot-readable codebook used by NA maintainers for operational communication and light obfuscation.
NOT cryptography. Do not use this to store passwords, API keys, tokens, or confidential data.

## Encoding Rules

### Row 1 (q–p) -> digits (no suffix)
q=1, w=2, e=3, r=4, t=5, y=6, u=7, i=8, o=9, p=0

### Row 2 (a–l) -> digit + dot "."
a=1., s=2., d=3., f=4., g=5., h=6., j=7., k=8., l=9.

### Row 3 (z–m) -> digit + comma ","
z=1,, x=2,, c=3,, v=4,, b=5,, n=6,, m=7,

### Space
space = _

## Special Substitution (optional)
S = $

Rule: When "$" appears, it decodes to "S". Do not use "$" for anything else in v1.

## Examples

### Example 1
"can you run" -> "3,1.6,_697_476,"

Breakdown:
c=3,  a=1.  n=6,  _  y=6 o=9 u=7  _  r=4 u=7 n=6,

### Example 2
"see" -> "$€€" is NOT VALID in v1 (E substitution removed).
Use only row rules and "$" for S.

## Decode Rules (reverse)
- Bare digit is row 1 letter (q–p mapping).
- Digit + "." is row 2 letter (a–l mapping).
- Digit + "," is row 3 letter (z–m mapping).
- "_" becomes space.
- "$" becomes S.
