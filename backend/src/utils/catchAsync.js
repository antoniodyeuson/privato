// Wrapper para tratar erros assíncronos
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
