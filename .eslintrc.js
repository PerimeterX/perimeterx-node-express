module.exports = {
    env: {
        browser: true,
        node: true,
        es6: true,
        mocha: true,
    },
    extends: 'perimeterx',
    rules: {
        'object-curly-spacing': [
            1,
            'always',
            {
                objectsInObjects: false,
                arraysInObjects: false,
            },
        ],
    },
};
