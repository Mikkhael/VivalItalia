
function get_obj_diff(base, other){
	// const res = base instanceof Array ? [] : {};
	const res = {};
	for(let [key, value] of Object.entries(other)){
		const cmp = base[key];
		if(typeof(cmp) !== typeof(value)){
			res[key] = value;
		}else if(typeof(cmp) === "object"){
			const new_value = get_obj_diff(cmp, value);
			if(Object.keys(new_value).length > 0){
				res[key] = new_value;
			}
		}else if(cmp !== value){
			res[key] = value;
		}
	}
	return res;
}

function merge_obj_diff(base, diff){
	for(let [key, value] of Object.entries(diff)){
		if(base[key] === undefined){
			base[key] = value;
		}else if(typeof(value) === "object"){
			merge_obj_diff(base[key], value);
		}else{
			base[key] = value;
		}
	}
}

function get_merged_wordlist_diff(base, [diff, removed]){
	const res = base.filter(x => !removed.has(x.ita));
	merge_obj_diff(res, diff);
	const sorted_res = sort_words(res);
	return sorted_res;
}


function get_merged_words_diff(base, diff_and_removed){
	let res = {};
	for(let key in diff_and_removed){
		const merged_wordlist =  get_merged_wordlist_diff(base[key] || [], diff_and_removed[key]);
		res[key] = merged_wordlist;
	}
	return res;
}

function get_words_diff(base, other){
	let res = {};
	for(let key in other){
		const diff_and_removed =  get_sorted_wordlist_diff(base[key] || [], other[key]);
		res[key] = diff_and_removed;
	}
	return res;
}

function get_sorted_wordlist_diff(w1, w2){
	if(w1.length === 0){
		console.log("CMP EMPTY", w1, w2);
		return w2;
	}

	let i1 = 0;
	let i2 = 0;
	const res = [];
	const removed = new Set();
	const check_end = () => {
		if(i1 >= w1.length){
			const to_add = w2.slice(i1);
			console.log("end1", to_add)
			if(to_add.length > 0)
				res.push(to_add);
			return true;
		}
		if(i2 >= w2.length){
			while(i1 < w1.length){
				removed.add(w1[i1].ita);
				i1++;
			}
			return true;
		}
		return false;
	}
	while(true){
		console.log("CMP", w1[i1].ita, w2[i2].ita, i1, i2);
		while(w1[i1].ita < w2[i2].ita) { 
			console.log("CMP rem", w1[i1].ita, w2[i2].ita, i1, i2);
			removed.add(w1[i1].ita);
			i1++;
			if(check_end()) return [res, removed];
		}
		while(w1[i1].ita === w2[i2].ita){
			const diff = get_obj_diff(w1[i1], w2[i2]);
			console.log("CMP diff", w1[i1].ita, w2[i2].ita, i1, i2, JSON.stringify(diff));
			if(Object.values(diff).length > 0){
				// console.log("CMP diff INSERT", diff);
				diff.ita = w2[i2].ita;
				res.push(diff);
			}
			i1++;
			i2++;
			if(check_end()) return [res, removed];
		}
		while(w1[i1].ita > w2[i2].ita){
			console.log("CMP new", w1[i1].ita, w2[i2].ita, i1, i2);
			res.push(w2[i2]);
			i2++;
			if(check_end()) return [res, removed];
		}
	}
}

/* // TEST //

base = {
	a: 123,
	b: 456,
	bb: 111,
	c: [
		789,
		{
			x: 1,
			y: "nie"
		},
		{
			z: "z"
		}
	],
	d: {
		"sjdisd-djfi": true,
	},
	e: {
		v1: {},
		v2: {}
	}
}
other = {
	a: 123,
	bb: 999,
	bbb: 777,
	c: [
		789,
		{
			x: 1,
			y: "nie"
		},
		{
			z: "z",
			g: "g",
		},
		"nowe"
	],
	e: {
		v1: {},
		v3: {}
	}
}
base_json = JSON.stringify(base);
other_json = JSON.stringify(other);
res = get_obj_diff(base, other);
merged_base = JSON.parse(base_json);
merged_other = JSON.parse(other_json);
merge_obj_diff(merged_base, res);
merge_obj_diff(merged_other, res);
console.log('base', base_json);
console.log('other', other_json);
console.log('res', JSON.stringify(res));
console.log('merged', JSON.stringify(merged_base));
console.log('merged2', JSON.stringify(merged_other), JSON.stringify(merged_other) === other_json);
*/
