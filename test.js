
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
			this.question = word.pol.join(', ');
			if(is_plural){
				this.question += " [l.&nbsp;mnoga]";
				this.info = "Podaj słowo po włosku, w liczbie mnogiej";
				this.expected = word.true_plural();
			}else{
				this.question += " [l.&nbsp;pojedyńcza]"
				this.info = "Podaj słowo po włosku, w liczbie pojedyńczej";
				this.expected = word.ita;
			}
		}else{
			if(is_plural){
				this.question = word.true_plural();
			}else{
				this.question = word.ita;
			}
			this.info = "Podaj słowo po polsku, w <b>liczbie pojedyńczej</b>. (Nie zaimplementowałemm liczby mnogiej po polsku)"
			this.expected = word.pol.join(', ');
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
			return this.word.pol.indexOf(answer_sanetized) !== -1;
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

