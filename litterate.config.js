//> This is the litterate configuration file for litterate itself.
module.exports = {
    name: 'Codeframe',
    description: 'Codeframe is the fastest, easiest way to build and deploy quick static webpages, and it\'s designed to be the best place to learn how to create things for the web, on the web. Read more [on GitHub](https://github.com/thesephist/codeframe).',
    //> We use GitHub Pages to host this generated site, which lives under a /litterate subdirectory
    baseURL: '/codeframe',
    files: [
        './src/**/*.js',
        './static/js/**/*.js',
    ],
}
