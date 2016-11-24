var express = require('express');
var router = express.Router();

router.get('/:name', function(req, res) {
  res.render('users', {
    name: req.params.name
  });
});
//test router
router.get('/test',function(req,res){
	res.render('test',{
		name:req.params.name
	});
});

module.exports = router;