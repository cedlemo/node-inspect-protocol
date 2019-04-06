const express = require('express');

const app = express();

app.listen(3000, () => {
	console.log('listening on port 3000');
});

app.get('/', (req, res) => {
	res.status(200).send('<h1>hi</h1>');
});
