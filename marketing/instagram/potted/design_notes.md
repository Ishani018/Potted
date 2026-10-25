# Design notes

**Concept.** One quiet picture of the town at dusk, with as little added as possible. The florist, the pet shop with its paw sign and the market stalls are all in frame, so the post says what Potted is without a word.

**Typography.** None. The logo's own lettering is the only text. A headline would sit on top of shop windows and lamps that are the point of the image.

**Palette.** Taken straight from the art: brick red roofs, green shop frames, amber lamplight, cool grey cobbles.

**Composition.** The shop row runs diagonally from top left to bottom right, ending at the market stalls. The logo sits in the dark roof area at bottom right, where it balances the lit shop front at top left.

**Image processing.**
1. Cropped a 941 x 941 square from the 1670 x 941 picture, starting 150 px from the left, to keep both shops, the paw sign and four stalls.
2. Scaled to 1080 x 1080 with Lanczos resampling (about 15% enlargement).
3. Placed the logo at 250 px wide, aspect ratio unchanged, 36 px from the right and 34 px from the bottom.

No recolouring, blur, borders or shadows.

**Caveat.** The source is a painted picture in a pixel style rather than a native-resolution sprite, so the 15% enlargement slightly softens fine edges. The pixel look is kept.
