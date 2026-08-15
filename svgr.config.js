module.exports = {
  // 1. Cleanly maps raw hex and keyword text colors down to currentColor
  replaceAttrValues: {
    'black': 'currentColor',
    '#000000': 'currentColor',
    '#000': 'currentColor',
    '#1A1A1A': 'currentColor',
    '#1a1a1a': 'currentColor',
    'white': 'none', // Keeps the backdrop clip rectangle hidden
  },

  // 2. Extra coverage: Uses SVGO optimizations to convert color attributes 
  // into currentColor automatically before properties are mapped.
  svgoConfig: {
    plugins: [
      {
        name: 'convertColors',
        params: {
          currentColor: true,
        },
      },
    ],
  },
};
