const fs = require("fs");

const COUNT = 500;
const filename = "test_words_long.json"

const words = {
	noun: [],
	verb: [],
	other: []
};

function get_w(n){
	return n.toString().length;
}
function fill(n, w){
	return '0'.repeat(w - get_w(n)) + n.toString();
}

let w = get_w(COUNT);
for(let i=0; i<COUNT; i++){
	let n = fill(i, w);
	words.noun.push({ita: `in${n}o`, pol: [`pn${n}a`], pol_plural: [`pn${n}y`]});
	words.verb.push({ita: `iv${n}are`, pol: [`pv${n}ć`]});
	words.other.push({ita: `io${n}s`, pol: [`po${n}z`]});
}

const json = JSON.stringify(words);
fs.writeFileSync(filename, json);

