
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
		case "pol": return truefalse;
		default:    return Math.random() > 0.5;
	} 
}

class TestQuestion_Noun extends TestQuestion{
	constructor(word, lang, is_plural){
		super("normal", word);
		this.is_pol = lang_to_is_pol(lang);
		this.is_plural = is_plural;

		if(this.is_pol){
			if(is_plural){
				this.question = word.pol_plural.join(', ');
				this.expected = word.true_plural();
			}else{
				this.question = word.pol.join(', ');
				this.expected = word.ita;
			}
			this.info = "Podaj słowo po włosku.";
		}else{
			if(is_plural){
				this.question = word.true_plural();
				this.expected = word.pol_plural.join(', ');
			}else{
				this.question = word.ita;
				this.expected = word.pol.join(', ');
			}
			this.info = "Podaj słowo po polsku."
		}
	}

	check_answer(answer){
		const answer_sanetized = answer.trim();
		if(this.is_pol){
			if(this.is_plural){
				return this.word.true_plural() === answer_sanetized;
			}else{
				return this.word.ita === answer_sanetized;
			}
		}else{
			if(this.is_plural){
				return this.word.pol_plural.indexOf(answer_sanetized) !== -1;
			}else{
				return this.word.pol.indexOf(answer_sanetized) !== -1;
			}
		}
	}
};

Array.prototype.random_index = function(){
	return Math.floor(Math.random() * this.length);
}

Array.prototype.extract_random = function(n = 1){
	if(this.length <= n){
		return this.splice(0, this.length);
	}
	const res = [];
	while(n > 0){
		console.log(res);
		res.push(...this.splice(this.random_index(), 1));
		n--;
	}
	console.log(res);
	return res;
}

function convert_words_to_questions(words, options){
    let res = [];
    for(let w of words){
        res.push(...w.to_all_questions(options));
    }
    return res;
}

