# FSP08 glazing study — NOT approved for Lexan

Retrieved 2026-09-13 from Reiman's public FSP08 product page:
https://reiman.pt/pt/wlw-fsp08-fsp08-slot-reduction-profile-8/

`FSP.pdf` is the unchanged vendor datasheet downloaded from:
https://www.reiman.pt/pub/media/technical_data/wolweiss/datasheets/fsp.pdf

No STEP link is exposed on that product page and no public FSP08 STEP was found.
No vendor STEP has been invented. `glazing.py` reconstructs a **study section**:
catalogue H=7, L=10.6, L1=7.9, t=1 mm; slot 8; panel range 3–5 mm.
Taper, lip shape and their installed deflection are assumptions, not dimensioned
vendor geometry. It is checked against our actual AST03003004 solids.

Catalogue material is black PVC, 2000 mm stock. Public listing snapshot:
€2.07 excluding / €2.55 including tax, quantity 1–1171 dispatched <48 h.
Not an order or stock reservation; confirm selling unit before purchase.

## Material blocker

LEXAN glazing guidance warns against plasticised soft PVC and incompatible
gaskets. FSP08's compound is not specified sufficiently to establish compatibility:
https://www.polyvantis.com/files/polyvantis-content/dokumente/LEXAN%E2%84%A2%20SHEET%20%28technical%20guides%29/LEXAN%E2%84%A2%20THERMOCLEAR%E2%84%A2%20MULTIWALL%20Sheet%20-%20Technical%2C%20Processing%20and%20Installation%20Guide.pdf

That guide is for multiwall sheet, not approval for our solid sheet. Obtain
written compatibility for the actual solid Lexan grade and gasket compound,
or select a compatible non-PVC slot insert before fabrication.

## Preliminary sizing

Frame daylight = leaf outer dimensions minus 60 mm. Assume usable slot depth
5 mm (7 mm section less 1 mm flange and 1 mm base). Nominal absolute thermal
growth bound = 0.000070 × (daylight + 10) × 40 K. This conservative study value
rounds up 0.0000675/K from the solid LEXAN FMR datasheet; exact sheet grade and
workshop temperature range remain unconfirmed:
https://www.polyvantis.com/files/polyvantis-content/dokumente/LEXAN%E2%84%A2%20SHEET%20%28technical%20datasheets%29/LEXAN%E2%84%A2%20SOLID%20SHEET/LEXAN%20MARGARD%20FMR%2C%20FMR604%20Sheet%20Datasheet%20-%20Americas.pdf

Per-edge reserve = max(2 mm, round UP to 0.1 mm of
(growth + 2 × cut tolerance + 1 mm positioning allowance)/2).
Panel cut = daylight + 10 − 2 × reserve. No credit for aluminium expansion.
Default reserve 2 mm, nominal engagement 3 mm. Height growth bound 1.7696 mm;
worst-case engagement estimate after contraction/tolerance/offset is 1.1152 mm.
**That shallow engagement is not proven adequate for pull-out or impact.**
Lips' contact, sliding friction, setting support and frame rigidity need validation.

Default provisional cuts (width × height × thickness), mm:

| Leaf | Previous inset cut | Slot-captured study cut |
|---|---|---|
| Left A | 316.75 × 614 × 4 | 330.75 × 628 × 4 |
| Left B | 356.75 × 614 × 4 | 370.75 × 628 × 4 |
| Rear A | 279.5 × 614 × 4 | 293.5 × 628 × 4 |
| Rear B | 319.5 × 614 × 4 | 333.5 × 628 × 4 |

Four strips per leaf with modelled 45-degree mitres; nominal corner abutment
does not establish a physical seal. Total long-point study length 7,777 mm;
stock planning must allow cutting waste. Assemble frame around
panel, without drilling Lexan; inner-slot connectors must not occupy the glazing
path. No final connector/corner solution or released cutting schedule is claimed.

Preliminary 2 m stock allocation (long-point dimensions, before saw allowance):
two bars each containing 634 + 634 + 376.75 + 336.75 = 1981.5 mm;
two bars each containing 634 + 634 + 339.5 + 299.5 = 1907 mm.
Four bars are a nominal minimum, with only 18.5 mm spare on the tightest bars;
confirm cutting/mitre process and allow a spare bar for fitting trials. This is
not a purchase recommendation while compound compatibility is unresolved.
