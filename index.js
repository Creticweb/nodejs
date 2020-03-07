const express = require('express');
const app = express();
const { parse } = require('querystring');
const Payment = require('./paykun/Payment').Payment;
var biguint = require('biguint-format');
const crypto = require('crypto');
var config = require('./config/config.global');
app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.sendFile('views/payment.html', { root: __dirname })
});

app.post('/start/payment', function (req, res) {

     let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
        let result = parse(body);
        let obj = new Payment(config.MERCHANT_ID, config.ACCESS_TOKEN, config.ENC_KEY, config.IS_LIVE);
        obj.initOrder("ORD_" + biguint(random(8), 'dec'), '<productDescription>', '<amount>', '<successUrl>', '<failedUrl>');
        obj.addCustomer('<customerName>', '<customerEmail>', '<customerMobileNo>');

        //Don't remove this below line
        obj.setCustomFields({'udf_1': 'some dummy data'});

        let requestData = obj.submit();
        res.render(__dirname + '/views/request', {
            action:requestData.action,
            encrypted_request: requestData.encrypted_request,
            merchant_id: requestData.merchant_id,
            access_token: requestData.access_token,
        });
    });

});

app.get('/paykun/success', function (req, res) {
    let queryParam = req.query;
    let obj = new Payment(config.MERCHANT_ID, config.ACCESS_TOKEN, config.ENC_KEY, config.IS_LIVE);
    obj.getStatus(queryParam['payment-id'],
        function(transactionDetail){
            if(transactionDetail.data.transaction.status == true) {
                res.render(__dirname + '/views/success', {
                    transactionId: transactionDetail.data.transaction.payment_id,
                    status: transactionDetail.data.transaction.status,
                    message: transactionDetail.data.message,
                    amount: transactionDetail.data.transaction.order.gross_amount,
                });
            } else {
                res.render(__dirname + '/views/fail', {
                    transactionId: transactionDetail.data.transaction.payment_id,
                    status: transactionDetail.data.transaction.status,
                    message: transactionDetail.data.message,
                    amount: transactionDetail.data.transaction.order.gross_amount,
                });
            }
        }
    );
});
app.get('/paykun/fail', function (req, res) {
    let queryParam = req.query;
    let obj = new Payment(config.MERCHANT_ID, config.ACCESS_TOKEN, config.ENC_KEY, config.IS_LIVE);
    obj.getStatus(queryParam['payment-id'],
        function(transactionDetail){
            res.render(__dirname + '/views/fail', {
                transactionId: transactionDetail.data.transaction.payment_id,
                status: transactionDetail.data.transaction.status,
                message: transactionDetail.data.message,
                amount: transactionDetail.data.transaction.order.gross_amount,
            });
        }
    );
});

function random(qty) {
    return crypto.randomBytes(qty)
}
app.listen(3000, () => console.log('Example app listening on port 3000!'))