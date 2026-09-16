# Bifold rail retention — superseded welded study

The active design now uses bolted stock-angle ends and 20×4 keepers. See
[STANDARD_METALWORK.md](STANDARD_METALWORK.md) for current cuts, countersinks,
bevels and assembly. The text below records the earlier welded design only.


Two continuous 304 stainless strips, 18 mm wide x 4 mm thick, replace the
segmented PETG keepers. Weld a 4 x 46 x 25 mm end bar to both strips at each
end, forming one removable underside assembly. End bars occupy the first/last
4 mm of rail; the PETG end relief is 4.2 mm inboard (0.2 mm clearance).
Top remains the printed channel roof backed by the 8 mm steel adapter under the 3030 header. Side guidance
remains PETG. This is not an all-metal fail-safe housing or a door-drop rating.

Custom prepared geometry is labelled nominal-solid, NOT vendor STEP. Supplier
must detail welds, distortion control and final machining before fabrication.
No parts have been ordered and no fabrication supplier has accepted this design.

## Geometry and provisional cuts

| Quantity | Part | Default dimensions, mm |
|---|---|---|
| 2 | Left keeper strip | 739.5 x 18 x 4 |
| 2 | Rear keeper strip | 670 x 18 x 4 |
| 4 | End bars | 4 x 46 x 25 |
| 60 | Steel compression sleeves | 6 OD x 4.3 ID x 23 long |
| 60 | Steel slot-bridge washers | 12 OD x 4.5 ID x 2 thick |

Each strip has 15 x 4.5 mm mounting holes; all module mounting stations remain
12 mm from module ends and at the midpoint, rows ±15 mm about the channel.
Print sleeve bores are 6.2 mm and top washer pockets 12.4 x 2.2 mm. Alignment
keys shorten to 10 mm to avoid those pockets; alignment effectiveness pending.
The 6.2 mm sleeve bore leaves only a nominal 0.4 mm PETG web toward the
23 mm channel at the ±15 mm mounting rows. Printability and local guide-wall
strength need a coupon test/redesign before full-door use; the metal clamp
path does not validate this thin printed wall.

The metal clamp stack is 4 + 23 + 2 = 29 mm. Existing M4 x 35 proposal leaves
6 mm beyond this stack for engagement, before any additional head washer.
Confirm actual slot nut thread position, engagement, bottoming, bolt head
clearance, strength class, torque and locking. Screws/nuts are still schedule
items, not fully modelled vendor solids. Sleeve stack tolerances must avoid
either uncontrolled loose print bodies or clamping/creeping the PETG.

The 12 mm bridge washers span the 8 mm-class header slot: sleeve ends alone
would sit over the slot opening and provide no intended bearing surface.
Nominal sleeve/washer/keeper/header contact is checked against actual solids.

## Capture and travel calculation

- Axle exit slot: 10 mm; spacer OD 8 mm gives 1 mm side clearance.
- Keeper washer OD 18 mm gives (18−10)/2 = 4 mm nominal overlap per side.
  The 22 mm roller has 6 mm nominal overlap, but the steel washer is the
  intended first straight-drop catch. Washer-to-strip vertical gap is 2.9 mm.
- Channel 23 mm / roller 22 mm gives ±0.5 mm nominal lateral freedom. Applying
  an additional assumed 1 mm combined edge/position error leaves 2.5 mm
  washer overlap on the disadvantaged side. Tilt, bending and fracture are
  not covered by this planar overlap calculation.
- Sampled normal travel (0.25-degree steps) yields minimum roller/end-bar
  clearance: left parked 2.501 mm, left closed-end 1.983 mm; rear parked
  4.727 mm, rear closed-end 1.670 mm. Subtracting two 0.5 mm cut allowances
  leaves only 0.670 mm at the tightest end, before sag/installation errors.
  These are study margins, not a proven continuous-motion/tolerance certificate.
- Tests at five normal poses require actual-solid clearance. An artificial
  4 mm downward washer displacement intersects both strips. Artificial roller
  overtravel intersects the end bars. Those are geometric capture witnesses,
  not drop/impact load tests.

## Screening calculation, NOT an assembly rating

For an illustrative 100 N static catch load entirely on one strip, assuming a
10 mm transverse cantilever and 8 mm effective contact width:
sigma = 6 F L / (b t²) = 46.9 MPa for t=4 mm. This omits the mounting holes,
washer bending, welds, bolt/nut strength, impact amplification and load sharing;
the 100 N and 8 mm patch are unconfirmed assumptions, not design requirements.
At a conservative 62 mm longitudinal simply-supported span and full 18 mm
strip width, a 100 N centre load gives 32.3 MPa and 0.026 mm elastic deflection
using E=200,000 MPa. Do not add these simplified results into a capacity claim.

304 reference properties (E=200,000 MPa, design strength 210 MPa) from
[BSSA](https://bssa.org.uk/bssa_articles/comparison-of-structural-design-in-stainless-steel-and-carbon-steel/).
Actual stock condition and design method require supplier/engineering approval.
The roller's published radial rating does not rate an axial catch, welded
assembly or printed guide: [GN753.1 manufacturer data](https://www.elesa-ganter.com/siteassets/PDF/EN/GN%20753.1.pdf).

## Assembly and unresolved evidence

Support the door independently during fitting/removal. Leave the lower
axle-to-carrier connection undone: the welded assembly cannot pass over the
attached carrier through its 10 mm slot. Place the roller/upper bushes/keeper
washer in the guide, feed the free lower axle through the retainer slot, fit
the sleeves/bridge washers and secure the header fixings. Then complete the
lower spacers, carrier and locking fastener stack. Recheck actual tool access
and assembly tolerances. Removal requires supporting the door and disconnecting
the carrier first; it opens the bottom retention path.

Verify compound/brush clearance at the closed end: provisional flexible brush
envelopes overlap the metal assembly and remain unknown, not collision waivers.
Operating stops and parked catches must keep routine impacts off the rollers;
end bars are backup only. Validate welds, fasteners, sleeve lengths, washer
support, racking/tilt, wear and representative impact loads before use.
