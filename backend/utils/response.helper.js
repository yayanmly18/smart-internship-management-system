exports.success = (data, message = "OK") => {
    return {
        success: true,
        message,
        data
    };
};

exports.error = (message = "Error") => {
    return {
        success: false,
        message
    };
};