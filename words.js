
////////// LANGUAGE REGULARS ////////////////


function sanitize_word(word){
    return word.trim();
}
function sanitize_word_arr(arr){
	return arr.map(x => sanitize_word(x)).filter(x => x != "");
}

function parse_words_json(words_json){
    let words_data = JSON.parse(words_json);
    words_data.noun  = sort_words(parse_words_data_nouns(words_data.noun  || []));
    words_data.verb  = sort_words(parse_words_data_verbs(words_data.verb  || []));
    words_data.other = sort_words(parse_words_data_other(words_data.other || []));

    return words_data;
}

function generate_words_json(words_data){
    let words_json = JSON.stringify(words_data);
    return words_json.toString();
}

function parse_words_data_nouns(words){
    return words.map(w => new WordNoun(
        w.ita,
        w.pol,
		w.pol_plural,
        w.case,
        w.plural
    ));
}
function parse_words_data_verbs(words){
    return words.map(w => new WordVerb(
        w.ita,
        w.pol,
        w.con,
        w.forms
    ));
}
function parse_words_data_other(words){
    return words.map(w => new WordOther(
        w.ita,
        w.pol
    ));
}


function sort_words(words){
    return words.sort((a, b) => {
        return a.ita > b.ita ? 1 : -1;
    })
}

function insert_word_sorted(words, word){
    console.log("INSERT WORDS", words);
    let index = words[0].findIndex(w => w.ita > word.ita);
    if(index < 0) index = words[0].length;
    words[0].splice(index, 0, word.clone());
    console.log("AFTER INSERT", words);
}

function create_empty_word(type){
    switch(type){
        case "noun":  return new WordNoun();
        case "verb":  return new WordVerb();
        case "other": return new WordOther();
    }
    return null;
}



//// NOUNS


class WordNoun{
    constructor(ita = '', pol = [], pol_plural = [], gram_case = "", plural = ""){
        this.ita = sanitize_word(ita);
        this.pol = sanitize_word_arr(pol);
        this.pol_plural = sanitize_word_arr(pol_plural);
        this.case = gram_case;
        this.plural = sanitize_word(plural);
    }

    true_case(){
        // console.log("C ", this.ita);
        return this.case || this.generate_regular_case();
    }
    true_plural(){
        return this.plural || this.generate_regular_plural();
    }

    clone(){
        return new WordNoun(
            this.ita,
            this.pol,
			this.pol_plural,
            this.case,
            this.plural
        );
    }

	is_complete(){
		return this.ita !== '' && this.pol.length > 0 && this.pol_plural.length > 0;
	}

    to_all_questions(options){
		if(!this.is_complete()){
			return [];
		}
		let res = [new TestQuestion_Noun(this, options.lang, false)];
		const add_plural = () => {
			res.push(new TestQuestion_Noun(this, options.lang, true));
		}
		switch(options.nouns_plural_level){
			case 0: return res;
			case 1: {
				if(this.plural !== "") add_plural();
				return res;
			}
			case 2: {
				if(Math.random() <= 0.5) add_plural();
				return res;
			}
			case 3: {
				add_plural();
				return res;
			}
		}
    }

    generate_regular_case(){
        const last_char = this.ita[this.ita.length - 1];
        if(last_char === 'o'){
            return 'm'
        }else if(last_char === 'a'){
            return 'f'
        }
        return '';
    }
    
    generate_regular_plural(){
        const last_char = this.ita[this.ita.length - 1];
        const pre_last = this.ita.length >= 2 ? this.ita[this.ita.length - 2] : "";
        const word_core = this.ita.slice(0,-1);
        if(last_char === 'o'){
            if(pre_last === "c"){
                return word_core + "hi";
            }else{
                return word_core + "i";
            }
        }else if(last_char === 'a'){
            if(pre_last === "c"){
                return word_core + "he";
            }else{
                return word_core + "e";
            }
        }else if(last_char === 'e'){
            return word_core + "i";
        }
        return '';
    }
}


//// VERBS

class WordVerb{
    constructor(ita = '', pol = [], con = "", forms = {}){
        this.ita = sanitize_word(ita);
        this.pol = sanitize_word_arr(pol);
        this.con = con;
        this.forms = {};
        this.load_form('normal', forms.normal);
    }

    load_form(name, data = [], count = 6){
        this.forms[name] = [];
        for(let i = 0; i < count; i++){
            this.forms[name][i] = sanitize_word(data[i] || "");
        }
    }

    clone(){
        return new WordVerb(
            this.ita,
            this.pol,
            this.con,
            this.forms
        );
    }

	is_complete(){
		return this.ita !== "" && this.pol.length > 0 &&
				sanitize_word_arr(this.true_form_normal()).length === 6;
	}

    to_all_questions(options){
		if(!this.is_complete()){
			return [];
		}
		let res = [new TestQuestion_Verb(this, options.lang, "inf")];
		const add_con = (form, persons) => {
			for(let i of persons){
				res.push(new TestQuestion_Verb(this, options.lang, form, i));
			}
		}
		switch(options.verbs_con_level){
			case 0: return res;
			case 1: {
				if(this.true_con() === "-") add_con("normal", [0,1,2,3,4,5]);
				return res;
			}
			case 2: {
				add_con("normal", [0,1,2,3,4,5].filter(x => Math.random() <= 1/6));
				return res;
			}
			case 3: {
				add_con("normal", [0,1,2,3,4,5]);
				return res;
			}
		}
    }

    true_con(){
        if(this.con){
            return this.con;
        }
        if(this.ita.slice(-3) === "are"){
            return "are";
        }
        return "-";
    }

    true_form_normal(){
        const con = this.true_con();

        if(con === "are"){
            const base = this.ita.slice(0, -3);
            const ends_with_i = base.length > 0 && (base[base.length - 1] === 'i');
            const opt_i = ends_with_i ? "" : "i";

            return [
                this.forms.normal[0] || base + 'o',
                this.forms.normal[1] || base + opt_i,
                this.forms.normal[2] || base + 'a',
                this.forms.normal[3] || base + opt_i + 'amo',
                this.forms.normal[4] || base + 'ate',
                this.forms.normal[5] || base + 'ano',
            ];
        }


        return this.forms.normal;
    }
}

//// OTHER /////

class WordOther{
    constructor(ita = '', pol = []){
        this.ita = sanitize_word(ita);
        this.pol = sanitize_word_arr(pol);
    }

    clone(){
        return new WordOther(
            this.ita,
            this.pol,
        );
    }

	is_complete(){
		return this.ita !== "" && this.pol.length > 0;
	}

    to_all_questions(options){
		if(!this.is_complete()){
			return [];
		}
		let res = [new TestQuestion_Other(this, options.lang)];
		return res;
    }
}

