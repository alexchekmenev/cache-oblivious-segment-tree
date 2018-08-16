module.exports = {
    nearestPowerOfTwoGTE: function (n) {
        let x = 1;
        while(x < n) {
            x *= 2;
        }
        return x;
    },
    nearestPowerOfTwoLTE: function (n) {
        let x = 1;
        while(x * 2 <= n) {
            x *= 2;
        }
        return x;
    }
};