const error = reason => {
    return {
        success: false,
        error: reason,
    }
}

const api = {
    frame: {},
}

api.frame.get = params => {
    return {
        content: 'test',
    };
}

module.exports = api;
