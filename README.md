# Ponzi Trust Token Seller Smart Contract
[![Coverage Status](https://coveralls.io/repos/github/PonziTrust/TokenSeller/badge.svg?branch=master)](https://coveralls.io/github/PonziTrust/TokenSeller?branch=master)
[![Build Status](https://travis-ci.org/PonziTrust/TokenSeller.svg?branch=master)](https://travis-ci.org/PonziTrust/TokenSeller)

The Token Seller contract sell [Ponzi](https://ponzitrust.com/) tokens for ether.


## Details
- Address: [0x4f05de977b234b323e57dbae2e9c219627970c49](https://etherscan.io/address/0x4f05de977b234b323e57dbae2e9c219627970c49)

More details on [ponzitrust.com](https://ponzitrust.com/).

### Full JSON ABI:
```
[{"constant":true,"inputs":[],"name":"availablePonzi","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"ponziAddress","outputs":[{"name":"ponziAddr","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ponziPriceInWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newPonziPriceInWei","type":"uint256"}],"name":"setPonziPriceInWei","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newNumerator","type":"uint256"},{"name":"newDenominator","type":"uint256"}],"name":"setRewardPercent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rewardPercent","outputs":[{"name":"numerator","type":"uint256"},{"name":"denominator","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"adminAddr","type":"address"},{"name":"rank","type":"uint8"}],"name":"provideAccess","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"refAddr","type":"address"}],"name":"byPonzi","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"ponziAddr","type":"address"}],"name":"setPonziAddress","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":false,"name":"newPrice","type":"uint256"}],"name":"PriceChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"refAddr","type":"address"},{"indexed":false,"name":"ponziAmount","type":"uint256"}],"name":"RewardRef","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amountInWei","type":"uint256"}],"name":"Withdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"rank","type":"uint8"}],"name":"ProvidingAccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"purchasedBy","type":"address"},{"indexed":true,"name":"priceInWei","type":"uint256"},{"indexed":false,"name":"ponziAmount","type":"uint256"},{"indexed":false,"name":"weiAmount","type":"uint256"},{"indexed":true,"name":"refAddr","type":"address"}],"name":"PonziSold","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"weiAmount","type":"uint256"},{"indexed":false,"name":"ponziPriceInWei","type":"uint256"},{"indexed":false,"name":"ponziBalance","type":"uint256"}],"name":"NotEnoughPonzi","type":"event"}]
```

## Installation
```
npm install
```

## Testing
Run test:
```
npm run test
```
Run coverage:
```
npm run coverage
```

## License
Code released under the [MIT License](https://github.com/TokenSeller/blob/master/LICENSE).
