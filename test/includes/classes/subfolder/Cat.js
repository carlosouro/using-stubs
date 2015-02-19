//
function Cat(name){
	this.name = name;
}
Cat.prototype = {
	pet: function(){
		return this.name +' purrs';
	}
}
module.exports = Cat;