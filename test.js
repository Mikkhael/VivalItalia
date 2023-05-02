
//////////// Questions /////////

function copy_if_array(arr){
    return (arr instanceof Array) ? [...arr] : arr;
}

class TestQuestion {
    constructor(type, word){
		this.type = type;
		this.word = word;
    }

	check_answer(answer){
		return false;
	}
};

function lang_to_is_pol(lang){
	switch(lang){
		case "ita": return false;
		case "pol": return true;
		default:    return Math.random() > 0.5;
	} 
}

class TestQuestion_Noun extends TestQuestion{
	constructor(word, lang, is_plural){
		super("normal", word);
		this.is_pol = lang_to_is_pol(lang);
		this.is_plural = is_plural;
	}

	generate(){
		if(this.is_pol){
			if(this.is_plural){
				this.question = this.word.pol_plural.join(', ');
				this.answer = this.word.true_plural();
			}else{
				this.question = this.word.pol.join(', ');
				this.answer = this.word.ita;
			}
			this.expected = this.answer;
			this.info = "Podaj rzeczownik po włosku.";
		}else{
			if(this.is_plural){
				this.question = this.word.true_plural();
				this.answer = this.word.pol_plural;
			}else{
				this.question = this.word.ita;
				this.answer = this.word.pol;
			}
			this.expected = this.answer.join(', ');
			this.info = "Podaj rzeczownik po polsku."
		}
		this.generated = true;
	}

	check_answer(answer){
		const answer_sanetized = answer.trim();
		return do_arrays_intersect(answer_sanetized, this.answer);
	}
};

const PRONOUNS = [
	[['io'], ['ja']],
	[['tu'], ['ty']],
	[['lui','lei'], ['on', 'ona', 'ono']],
	[['noi'], ['my']],
	[['voi'], ['wy']],
	[['loro'], ['oni', 'one']],
];
class TestQuestion_Verb extends TestQuestion{
	constructor(word, lang, form, person = 0){
		super("normal", word);
		this.is_pol = lang_to_is_pol(lang);
		this.form = form;
		this.person = person;
	}

	generate(){
		if(this.is_pol){
			if(this.form === "normal"){
				const pronoun_pol = PRONOUNS[this.person][1].random_elem();
				this.question = pronoun_pol + " " + this.word.pol.join(', ');
				this.expected = this.word.true_form_normal()[this.person];
				this.answer = this.expected;
				this.info = "Podaj czasownik po włosku, w podanej osobie.";
			}else{
				this.question = this.word.pol.join(', ');
				this.expected = this.word.ita;
				this.answer = this.expected;
				this.info = "Podaj czasownik po włosku, w bezokoliczniku.";
			}
		}else{
			if(this.form === "normal"){
				const form_normal = this.word.true_form_normal();
				this.question = form_normal[this.person];
				this.answer = this.word.pol;

				// Wina czasowników jak "sono", identycznych w osobach 0 i 5
				this.answer_pronoun = PRONOUNS.filter((pro, pro_i) => 
											form_normal[pro_i] === form_normal[this.person])
										.map(pro => pro[1])
										.flat();
				
				this.expected = this.answer_pronoun.join('/') + " " + this.word.pol.join(", ");
				this.info = "Podaj czasownik po polsku, <b>dodając do bezokolicznika odpowiedni zaimek</b> (np. zamiast 'robię' napisz 'ja robić'). Nie zaimplementowano odmiany czasowników polskich.";
			}else{
				this.question = this.word.ita;
				this.expected = this.word.pol.join(', ');
				this.answer = this.word.pol;
				this.info = "Podaj czasownik po polsku, w bezokoliczniku.";
			}
		}
		this.generated = true;
	}

	check_answer(answer){
		const answer_sanetized = answer.trim();
		if(this.answer_pronoun){
			const [answer_pronoun,answer_verb] = answer_sanetized.split(/\s+/);
			return do_arrays_intersect(answer_pronoun, this.answer_pronoun) &&
				   do_arrays_intersect(answer_verb, this.answer);
		}else{
			return do_arrays_intersect(answer_sanetized, this.answer);
		}
	}
};

function do_arrays_intersect(arr1, arr2){
	if(!(arr1 instanceof Array)) arr1 = [arr1];
	if(!(arr2 instanceof Array)) arr2 = [arr2];
	for(let elem of arr1){
		if(arr2.indexOf(elem) !== -1){
			return true;
		}
	}
	return false;
}

class TestQuestion_Adj extends TestQuestion{
	constructor(word, lang){
		super("normal", word);
		this.is_pol = lang_to_is_pol(lang);
	}

	generate(){
		if(this.is_pol){
			this.question = this.word.pol.join(', ');
			this.answer = this.word.ita;
			this.expected = this.answer;
			this.info = "Podaj przymiotnik po włosku."
		}else{
			this.question = this.word.ita;
			this.answer = this.word.pol;
			this.expected = this.answer.join(', ');
			this.info = "Podaj przymiotnik po polsku."
		}
		this.generated = true;
	}

	check_answer(answer){
		const answer_sanetized = answer.trim();
		return do_arrays_intersect(answer_sanetized, this.answer);
	}
};
class TestQuestion_Other extends TestQuestion{
	constructor(word, lang){
		super("normal", word);
		this.is_pol = lang_to_is_pol(lang);
	}

	generate(){
		if(this.is_pol){
			this.question = this.word.pol.join(', ');
			this.answer = this.word.ita;
			this.expected = this.answer;
			this.info = "Podaj słowo po włosku."
		}else{
			this.question = this.word.ita;
			this.answer = this.word.pol;
			this.expected = this.answer.join(', ');
			this.info = "Podaj słowo po polsku."
		}
		this.generated = true;
	}

	check_answer(answer){
		const answer_sanetized = answer.trim();
		return do_arrays_intersect(answer_sanetized, this.answer);
	}
};

Array.prototype.random_index = function(){
	return Math.floor(Math.random() * this.length);
}
Array.prototype.random_elem = function(){
	return this[this.random_index()];
}

Array.prototype.extract_random = function(n = 1){
	if(this.length <= n){
		return this.splice(0, this.length);
	}
	const res = [];
	while(n > 0){
		// console.log(res);
		res.push(...this.splice(this.random_index(), 1));
		n--;
	}
	console.log(res);
	return res;
}

function convert_words_to_questions(words, options, excluded_set){
    let res = [];
    for(let w of words){
		if(excluded_set.has(w.ita)) continue;
		console.log(w, w.to_all_questions);
        res.push(...w.to_all_questions(options));
    }
    return res;
}

