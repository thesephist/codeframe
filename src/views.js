const baseTpl = require('../templates/base.js');

const baseView = () => {
    return baseTpl();
}

const liveFrameView = () => {
    return 'live site';
}

module.exports = {
    baseView,
    liveFrameView,
};
