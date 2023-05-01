
//////////// Questions /////////

function copy_if_array(arr){
    return (arr instanceof Array) ? [...arr] : arr;
}
class Question {
    constructor(type, rev, ita, pol, options){
        this.type = type;
        this.ita = ita;
        this.pol = [...pol];
        this.rev = rev;
        // Nouns
        this.article = copy_if_array(options.article); // [string]?
        this.plural = options.plural; // bool?

        // Verb
        this.person = copy_if_array(options.person); // [normal | "inf"]
    }
};

function question_gen_rev(options){
    console.log(options.questions_lang);
    if(options.questions_lang == "ita") return false;
    if(options.questions_lang == "pol") return true;
    return Math.random() >= 0.5;
}

function get_random_element_from_array(arr){
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
}
function extract_random_element_from_array(arr){
    if(arr.length === 0){
        return undefined;
    }
    const i = Math.floor(Math.random() * arr.length);
    const res = arr[i];
    arr.splice(i, 1);
    return res;
}
function extract_random_elements_from_array(arr, n){
    const res = [];
    while(n > 0 && arr.length > 0){
        res.push(extract_random_element_from_array(arr));
        n = n - 1;
    }
    return res;
}

function convert_words_to_questions(words, options){
    let res = [];
    for(let w of words){
        res.push(...w.to_all_questions(options));
    }
    return res;
}

