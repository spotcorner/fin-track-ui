const utils = {
    getFormattedAmount: (amount) => {
        return (amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
        });
    },
}

export default utils;