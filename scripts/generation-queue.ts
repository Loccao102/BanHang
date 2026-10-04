export type GenerationTask = {
  imageName: string;
  targetFilename: string;
  category: string;
  color: string;
  material: string;
  prompt: string;
};

export const generationTasks: GenerationTask[] = [
  // Bermuda Shorts & Tweed Shorts
  {
    imageName: "pants_bermuda_shorts_black",
    targetFilename: "pants-bermuda-shorts-black.jpg",
    category: "bottoms",
    color: "black",
    material: "wool blend",
    prompt: "High-end e-commerce flat-lay product photograph of luxury black tailored pleated bermuda shorts, knee-length, sharp front pleats, belt loops, structured waistband, rich black suiting fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_bermuda_shorts_beige",
    targetFilename: "pants-bermuda-shorts-beige.jpg",
    category: "bottoms",
    color: "beige",
    material: "cotton twill",
    prompt: "High-end e-commerce flat-lay product photograph of luxury beige cream tailored pleated bermuda shorts, knee-length, sharp front pleats, belt loops, structured waistband, premium beige cotton suiting fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_bermuda_shorts_grey",
    targetFilename: "pants-bermuda-shorts-grey.jpg",
    category: "bottoms",
    color: "grey",
    material: "wool blend",
    prompt: "High-end e-commerce flat-lay product photograph of luxury heather grey tailored pleated bermuda shorts, knee-length, sharp front pleats, belt loops, structured waistband, fine grey suiting fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_tweed_shorts_black",
    targetFilename: "pants-tweed-shorts-black.jpg",
    category: "bottoms",
    color: "black",
    material: "boucle tweed",
    prompt: "High-end e-commerce flat-lay product photograph of luxury black high-waisted tweed shorts, decorative embossed gold metal buttons on front, rich bouclé tweed texture with subtle shimmer, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_tweed_shorts_white",
    targetFilename: "pants-tweed-shorts-white.jpg",
    category: "bottoms",
    color: "white",
    material: "boucle tweed",
    prompt: "High-end e-commerce flat-lay product photograph of luxury ivory white high-waisted tweed shorts, decorative embossed gold metal buttons on front, rich bouclé tweed texture with subtle metallic thread, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Tweed Skirts
  {
    imageName: "skirt_tweed_mini_black",
    targetFilename: "skirt-tweed-mini-black.jpg",
    category: "bottoms",
    color: "black",
    material: "boucle tweed",
    prompt: "High-end e-commerce flat-lay product photograph of a chic black A-line tweed mini skirt, double decorative embossed gold buttons on front waist, rich bouclé tweed weave with delicate sparkle, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "skirt_tweed_mini_white",
    targetFilename: "skirt-tweed-mini-white.jpg",
    category: "bottoms",
    color: "white",
    material: "boucle tweed",
    prompt: "High-end e-commerce flat-lay product photograph of a chic ivory white A-line tweed mini skirt, double decorative embossed gold buttons on front waist, rich textured bouclé tweed weave, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Denim Flares & Skirt
  {
    imageName: "pants_flare_denim_black",
    targetFilename: "pants-flare-denim-black.jpg",
    category: "bottoms",
    color: "black",
    material: "denim",
    prompt: "High-end e-commerce flat-lay product photograph of vintage washed charcoal black denim flare jeans, bell bottom flare leg, authentic denim twill texture with natural seam fading, metal button and zipper fly, five pockets, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_flare_denim_white",
    targetFilename: "pants-flare-denim-white.jpg",
    category: "bottoms",
    color: "white",
    material: "denim",
    prompt: "High-end e-commerce flat-lay product photograph of crisp optic white denim flare jeans, bell bottom flare leg, authentic white denim twill texture, silver metal button and rivets, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "skirt_denim_mini_black",
    targetFilename: "skirt-denim-mini-black.jpg",
    category: "bottoms",
    color: "black",
    material: "denim",
    prompt: "High-end e-commerce flat-lay product photograph of washed black denim mini skirt, slight raw hem, classic 5-pocket denim styling, authentic black denim wash texture, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Slit Midi Skirts
  {
    imageName: "skirt_slit_midi_beige",
    targetFilename: "skirt-slit-midi-beige.jpg",
    category: "bottoms",
    color: "beige",
    material: "satin silk",
    prompt: "High-end e-commerce flat-lay product photograph of a luxurious champagne beige satin bias-cut midi skirt with elegant high side slit, glossy pure silk drape and soft folds, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "skirt_slit_midi_red",
    targetFilename: "skirt-slit-midi-red.jpg",
    category: "bottoms",
    color: "red",
    material: "satin silk",
    prompt: "High-end e-commerce flat-lay product photograph of a luxurious crimson red satin bias-cut midi skirt with elegant high side slit, rich ruby silk sheen, fluid drape and soft folds, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "skirt_slit_midi_brown",
    targetFilename: "skirt-slit-midi-brown.jpg",
    category: "bottoms",
    color: "brown",
    material: "satin silk",
    prompt: "High-end e-commerce flat-lay product photograph of a luxurious espresso chocolate brown satin bias-cut midi skirt with elegant high side slit, glossy silk sheen, fluid drape, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Tweed Jacket Black
  {
    imageName: "jacket_tweed_crop_black",
    targetFilename: "jacket-tweed-crop-black.jpg",
    category: "outerwear",
    color: "black",
    material: "boucle tweed",
    prompt: "High-end e-commerce flat-lay product photograph of a luxury black cropped tweed jacket, round collarless neckline, ornate embossed gold metal buttons down front and on faux pockets, rich bouclé tweed texture, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Corsets (Lace)
  {
    imageName: "top_corset_lace_white",
    targetFilename: "top-corset-lace-white.jpg",
    category: "tops",
    color: "white",
    material: "floral lace",
    prompt: "High-end e-commerce flat-lay product photograph of a romantic ivory white floral lace boned corset top, sweetheart neckline, delicate sheer lace panels, satin binding trims, structured boning, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_corset_lace_red",
    targetFilename: "top-corset-lace-red.jpg",
    category: "tops",
    color: "red",
    material: "floral lace",
    prompt: "High-end e-commerce flat-lay product photograph of a seductive crimson red floral lace boned corset top, sweetheart neckline, delicate sheer lace floral embroidery, satin binding, structured boning, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Tube Tops
  {
    imageName: "top_tube_satin_black",
    targetFilename: "top-tube-satin-black.jpg",
    category: "tops",
    color: "black",
    material: "satin",
    prompt: "High-end e-commerce flat-lay product photograph of a chic black satin sweetheart tube top, strapless bandeau silhouette, curved sweetheart neckline, clean tailored seams, glossy silk satin finish, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_tube_satin_white",
    targetFilename: "top-tube-satin-white.jpg",
    category: "tops",
    color: "white",
    material: "satin",
    prompt: "High-end e-commerce flat-lay product photograph of a chic ivory white satin sweetheart tube top, strapless bandeau silhouette, curved sweetheart neckline, clean tailored seams, glossy satin sheen, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_tube_satin_red",
    targetFilename: "top-tube-satin-red.jpg",
    category: "tops",
    color: "red",
    material: "satin",
    prompt: "High-end e-commerce flat-lay product photograph of a chic scarlet red satin sweetheart tube top, strapless bandeau silhouette, curved sweetheart neckline, clean tailored seams, glossy red satin finish, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Baby Tees
  {
    imageName: "top_baby_tee_white",
    targetFilename: "top-baby-tee-white.jpg",
    category: "tops",
    color: "white",
    material: "compact cotton",
    prompt: "High-end e-commerce flat-lay product photograph of a 90s vintage fitted white cotton baby tee, crew neck, short cap sleeves, cropped length, fine 100% compact cotton jersey texture, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_baby_tee_black",
    targetFilename: "top-baby-tee-black.jpg",
    category: "tops",
    color: "black",
    material: "compact cotton",
    prompt: "High-end e-commerce flat-lay product photograph of a 90s vintage fitted black cotton baby tee, crew neck, short cap sleeves, cropped length, fine 100% compact cotton jersey texture, rich deep black color, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Halter Bodysuits
  {
    imageName: "top_halter_bodysuit_black",
    targetFilename: "top-halter-bodysuit-black.jpg",
    category: "tops",
    color: "black",
    material: "seamless spandex",
    prompt: "High-end e-commerce flat-lay product photograph of a sleek seamless black halterneck bodysuit, high halter neck, backless cut, smooth sculpting matte elastane fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_halter_bodysuit_white",
    targetFilename: "top-halter-bodysuit-white.jpg",
    category: "tops",
    color: "white",
    material: "seamless spandex",
    prompt: "High-end e-commerce flat-lay product photograph of a sleek seamless optic white halterneck bodysuit, high halter neck, backless cut, smooth sculpting double-layered matte elastane fabric, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_halter_bodysuit_red",
    targetFilename: "top-halter-bodysuit-red.jpg",
    category: "tops",
    color: "red",
    material: "seamless spandex",
    prompt: "High-end e-commerce flat-lay product photograph of a sleek seamless crimson red halterneck bodysuit, high halter neck, backless cut, smooth sculpting matte elastane fabric, vibrant crimson color, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Velvet Dress Ivory White
  {
    imageName: "dress_velvet_body_white",
    targetFilename: "dress-velvet-body-white.jpg",
    category: "dress",
    color: "white",
    material: "plush velvet",
    prompt: "High-end e-commerce flat-lay product photograph of a luxurious ivory white plush velvet bodycon midi dress, corset boning seams at bodice, long sleeves, square neckline, rich velvety texture and soft pearlescent luster, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Siren Mini Dresses
  {
    imageName: "dress_siren_mini_white",
    targetFilename: "dress-siren-mini-white.jpg",
    category: "dress",
    color: "white",
    material: "thick jersey",
    prompt: "High-end e-commerce flat-lay product photograph of a chic strapless white bandeau mini dress with subtle waist cutout, short fitted bodycon silhouette, premium thick stretch ponte jersey, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_siren_mini_red",
    targetFilename: "dress-siren-mini-red.jpg",
    category: "dress",
    color: "red",
    material: "thick jersey",
    prompt: "High-end e-commerce flat-lay product photograph of a chic strapless crimson red bandeau mini dress with subtle waist cutout, short fitted bodycon silhouette, premium thick stretch ponte jersey, vibrant red color, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Luna Backless Halter Dresses
  {
    imageName: "dress_luna_halter_black",
    targetFilename: "dress-luna-halter-black.jpg",
    category: "dress",
    color: "black",
    material: "silk satin",
    prompt: "High-end e-commerce flat-lay product photograph of an elegant black silk halterneck backless midi dress, gathered high neckline, fluid bias-cut drape, glossy silk sheen, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_luna_halter_white",
    targetFilename: "dress-luna-halter-white.jpg",
    category: "dress",
    color: "white",
    material: "silk satin",
    prompt: "High-end e-commerce flat-lay product photograph of an elegant ivory white silk halterneck backless midi dress, gathered high neckline, fluid bias-cut drape, soft pearl silk sheen, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_luna_halter_green",
    targetFilename: "dress-luna-halter-green.jpg",
    category: "dress",
    color: "green",
    material: "silk satin",
    prompt: "High-end e-commerce flat-lay product photograph of a breathtaking emerald green silk halterneck backless midi dress, gathered high neckline, fluid bias-cut drape, rich jewel-toned green silk sheen, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_luna_halter_red",
    targetFilename: "dress-luna-halter-red.jpg",
    category: "dress",
    color: "red",
    material: "silk satin",
    prompt: "High-end e-commerce flat-lay product photograph of a stunning ruby red silk halterneck backless midi dress, gathered high neckline, fluid bias-cut drape, glossy red silk luster, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Celeste Draped Column Maxi Dresses
  {
    imageName: "dress_celeste_maxi_black",
    targetFilename: "dress-celeste-maxi-black.jpg",
    category: "dress",
    color: "black",
    material: "silk chiffon",
    prompt: "High-end e-commerce flat-lay product photograph of an opulent black draped column maxi evening dress, asymmetric gathered neckline, fluid flowing silk chiffon drape to the floor, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_celeste_maxi_red",
    targetFilename: "dress-celeste-maxi-red.jpg",
    category: "dress",
    color: "red",
    material: "silk chiffon",
    prompt: "High-end e-commerce flat-lay product photograph of an opulent burgundy wine-red draped column maxi evening dress, asymmetric gathered neckline, fluid flowing silk chiffon drape to the floor, rich wine red color, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "dress_celeste_maxi_white",
    targetFilename: "dress-celeste-maxi-white.jpg",
    category: "dress",
    color: "white",
    material: "silk chiffon",
    prompt: "High-end e-commerce flat-lay product photograph of an opulent ivory white draped column maxi evening dress, asymmetric gathered neckline, fluid flowing silk chiffon drape to the floor, soft ethereal drape, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Hourglass Blazers
  {
    imageName: "blazer_hourglass_black",
    targetFilename: "blazer-hourglass-black.jpg",
    category: "outerwear",
    color: "black",
    material: "tailored wool",
    prompt: "High-end e-commerce flat-lay product photograph of a modern black tailored hourglass blazer, dramatically cinched waist, peaked lapels, flap pockets, structured padded shoulders, luxury wool blend suiting fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "blazer_hourglass_beige",
    targetFilename: "blazer-hourglass-beige.jpg",
    category: "outerwear",
    color: "beige",
    material: "tailored wool",
    prompt: "High-end e-commerce flat-lay product photograph of a modern camel beige tailored hourglass blazer, dramatically cinched waist, peaked lapels, flap pockets, structured padded shoulders, luxury beige wool blend suiting fabric, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Front-Slit Trousers
  {
    imageName: "pants_slit_trousers_black",
    targetFilename: "pants-slit-trousers-black.jpg",
    category: "bottoms",
    color: "black",
    material: "stretch crepe",
    prompt: "High-end e-commerce flat-lay product photograph of elegant black slim flared trousers with distinct front ankle slits, clean flat front waist, tailored stretch crepe fabric with sharp center creases, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Ribbed Crop Tops
  {
    imageName: "top_ribbed_crop_white",
    targetFilename: "top-ribbed-crop-white.jpg",
    category: "tops",
    color: "white",
    material: "rib knit",
    prompt: "High-end e-commerce flat-lay product photograph of a modern white ribbed square-neck crop top, wide straps, fine vertical rib-knit texture, cropped waistline, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_ribbed_crop_beige",
    targetFilename: "top-ribbed-crop-beige.jpg",
    category: "tops",
    color: "beige",
    material: "rib knit",
    prompt: "High-end e-commerce flat-lay product photograph of a modern warm beige ribbed square-neck crop top, wide straps, fine vertical rib-knit texture, cropped waistline, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Poplin Shirts
  {
    imageName: "shirt_poplin_white",
    targetFilename: "shirt-poplin-white.jpg",
    category: "tops",
    color: "white",
    material: "cotton poplin",
    prompt: "High-end e-commerce flat-lay product photograph of an oversized crisp white cotton poplin button-down shirt, pointed collar, pearl buttons, chest pocket, cuffed sleeves, structured 100% poplin cotton, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "shirt_poplin_blue",
    targetFilename: "shirt-poplin-blue.jpg",
    category: "tops",
    color: "blue",
    material: "cotton poplin",
    prompt: "High-end e-commerce flat-lay product photograph of an oversized pastel sky-blue cotton poplin button-down shirt, pointed collar, white buttons, chest pocket, structured 100% poplin cotton, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "shirt_poplin_black",
    targetFilename: "shirt-poplin-black.jpg",
    category: "tops",
    color: "black",
    material: "cotton poplin",
    prompt: "High-end e-commerce flat-lay product photograph of an oversized jet black cotton poplin button-down shirt, pointed collar, black buttons, chest pocket, structured 100% poplin cotton, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "shirt_oxford_striped_white",
    targetFilename: "shirt-oxford-striped-white.jpg",
    category: "tops",
    color: "white",
    material: "oxford cotton",
    prompt: "High-end e-commerce flat-lay product photograph of a classic white and light blue thin-striped oxford button-down shirt, button-down collar, chest pocket, crisp structured oxford cotton weave, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Knit Tanks & Basics
  {
    imageName: "top_knit_tank_black",
    targetFilename: "top-knit-tank-black.jpg",
    category: "tops",
    color: "black",
    material: "knit",
    prompt: "High-end e-commerce flat-lay product photograph of a chic black high-neck sleeveless knit tank top, mock neck, fine ribbed knit texture, clean fitted silhouette, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_knit_tank_white",
    targetFilename: "top-knit-tank-white.jpg",
    category: "tops",
    color: "white",
    material: "knit",
    prompt: "High-end e-commerce flat-lay product photograph of a chic ivory white high-neck sleeveless knit tank top, mock neck, fine ribbed knit texture, clean fitted silhouette, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "top_basic_black",
    targetFilename: "top-basic-black.jpg",
    category: "tops",
    color: "black",
    material: "cotton jersey",
    prompt: "High-end e-commerce flat-lay product photograph of a minimalist black scoop-neck seamless ribbed tank top, wide scoop neckline, smooth ribbed stretch cotton, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Chinos Pants
  {
    imageName: "pants_chinos_beige",
    targetFilename: "pants-chinos-beige.webp",
    category: "bottoms",
    color: "beige",
    material: "cotton gabardine",
    prompt: "High-end e-commerce flat-lay product photograph of luxury tailored pleated beige city chinos trousers, relaxed straight leg, sharp front pleats, slant pockets, refined cotton gabardine, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },
  {
    imageName: "pants_chinos_black",
    targetFilename: "pants-chinos-black.jpg",
    category: "bottoms",
    color: "black",
    material: "cotton gabardine",
    prompt: "High-end e-commerce flat-lay product photograph of luxury tailored pleated black city chinos trousers, relaxed straight leg, sharp front pleats, slant pockets, refined black cotton gabardine, laid flat neatly on seamless pure crisp white background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  },

  // Silk Slip Dress White
  {
    imageName: "dress_satin_slip_white",
    targetFilename: "dress-satin-slip-white.jpg",
    category: "dress",
    color: "white",
    material: "satin silk",
    prompt: "High-end e-commerce flat-lay product photograph of an elegant pure white silk satin slip midi dress, delicate cowl neckline, thin spaghetti straps, fluid bias-cut drape, glossy silk sheen, laid flat neatly on seamless pure crisp light background, professional studio fashion photography, top-down shot, packshot, perfectly centered, no models, no people, no mannequin, clothing only"
  }
];
