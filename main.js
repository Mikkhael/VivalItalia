

/*
JSON Words format

Nouns:[
    ita:string,
    pol:[string],
    case:(f|m|o|"") // o = other, "" = regular
    plural:string // "" = regular
]
Verbs:[
    ita:string,
    pol:[string],
    con: ("-" | "are" | "") // "" = autodetect regular
    forms:{
        normal:[
            String x6 // "" = regular (according to type) 
        ]
    }
]

*/


////////// LANGUAGE REGULARS ////////////////

function sanitize_word(word){
    return word.trim();
}

function parse_words_json(words_json){
    let words_data = JSON.parse(words_json);
    words_data.nouns = sort_words(parse_words_data_nouns(words_data.nouns));
    words_data.verbs = sort_words(parse_words_data_verbs(words_data.verbs));

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
        w.case,
        w.plural
    ));
}
function parse_words_data_verbs(word){
    return word.map(w => new WordVerb(
        w.ita,
        w.pol,
        w.con,
        w.forms
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
        case "noun": return new WordNoun('', []);
        case "verb": return new WordVerb('', []);
    }
    return null;
}

let APP_CTX = null;

const TEST_WORD_JSON = `
    {
        "nouns": [
            {"ita": "gatto", "pol":["kot", "kocur"]},
            {"ita": "amico", "pol":["przyjaciel"], "plural":"amici"},
            {"ita": "amica", "pol":["przyjaciułka"]},
            {"ita": "cane", "pol":["pies"], "case":"m"}
        ],
        "verbs": [
            {"ita": "essere", "pol":["być"], "con":"-", "forms":{
                "normal": ["sono","sei","e","siamo","siete","sono"]
            }},
            {"ita": "comprare", "pol":["kupować"], "con":"are", "forms":{}},
            {"ita": "mangiare", "pol":["jeść"], "con":"", "forms":{
                "normal": ["","","mangisima"]
            }}
        ]
    }
`;
const EMPTY_JSON = `
    {
        "nouns":[],
        "verbs":[]
    }
`;
const default_words_json_url = "";
function fetch_words_json(url = default_words_json_url){
    return new Promise.resolve(TEST_WORD_JSON);
}
function get_loacal_words_json(){
    return localStorage?.getItem("words_json") || EMPTY_JSON;
}
function save_loacl_words_json(json){
    if(typeof json != "string"){
        console.error("BAD JSON");
        return false;
    }
    if(localStorage){
        localStorage.setItem("words_json", json)
        return true;
    }
    return false;
}
function export_words_json(json){
    if(typeof json != "string"){
        console.error("BAD JSON");
        return false;
    }
    const data_url = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    const a_elem = document.createElement('a');
    a_elem.setAttribute('href', data_url);
    a_elem.setAttribute('download', `words ${new Date().toISOString()}.json`);
    a_elem.click();
    return true;
}

//// NOUNS


class WordNoun{
    constructor(ita, pol, gram_case = "", plural = ""){
        this.ita = sanitize_word(ita);
        this.pol = pol.map(x => sanitize_word(x));
        this.case = gram_case;
        this.plural = sanitize_word(plural);
    }

    true_case(){
        console.log("C ", this.ita);
        return this.case || this.generate_regular_case();
    }
    true_plural(){
        return this.plural || this.generate_regular_plural();
    }

    clone(){
        return new WordNoun(
            this.ita,
            this.pol,
            this.case,
            this.plural
        );
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

    true_data(){
        return {
            ita: this.ita,
            pol: this.pol,
            case: this.true_case(),
            plural: this.true_plural(),
        };
    }
}


//// VERBS

class WordVerb{
    constructor(ita, pol, con = "", forms = {}){
        this.ita = sanitize_word(ita);
        this.pol = pol.map(w => sanitize_word(w));
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

    true_con(){
        if(this.con){
            return this.con;
        }
        if(this.ita.slice(-3) === "are"){
            return "are";
        }
        return "";
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



///////// WORD COMPONENTS /////////

const WordCard = {
    props:[
        "type",
        "sourceWord"
    ],
    emits:[
        "update-word",
        "delete_word"
    ],
    data(){
        return{
            word: this.sourceWord.clone()
        };
    },
    computed:{
        pol_string:{
            get(){ return this.word.pol.join(','); },
            set(value){ this.word.pol = value.split(','); },
        }
    },
    methods:{
        update_word(){
            this.$emit('update-word', this.word.clone());
        },
        focus_on_word(){
            this.$refs.word_ita_input.focus();
        }
    },
    template: /*html*/`
    <div class="word_card" :class="type">
        <div class="word_options">
            <div class="main">
                <span>Słowo</span>
                <input type="text" v-model="word.ita" ref="word_ita_input">
            </div>
            <div class="main">
                <span title="Jeśli jest wiele dopiszczalnych tłumaczeń, można podać wszystkie, oddzielając przecinkami">Tłumaczenia</span>
                <input type="text" v-model="pol_string">
            </div>
            <template v-if="type === 'noun'">
                <div>
                    <span>Rodzaj</span>
                    <RadioList v-model:option="word.case" :option_values="[['Auto',''],['Męski','m'],['Żeński','f']]" :soft_option="word.true_case()" />
                </div>
                <div>
                    <span>Liczba mnoga</span>
                    <input type="text" v-model="word.plural" :placeholder="word.true_plural()">
                </div>
            </template>
            <template v-if="type === 'verb'">
                <div class="small" v-for="i in 6">
                    <span>{{['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'][i-1]}}</span>
                    <input type="text" v-model="word.forms.normal[i-1]" :placeholder="word.true_form_normal()[i-1]">
                </div>
                <div>
                    <span>Konigacja</span>
                    <!-- <input type="text" v-model="word.con" :placeholder="word.true_con()"> -->
                    <RadioList v-model:option="word.con" :option_values="[['Auto',''],['Inne','-'],['-are','are']]" :soft_option="word.true_con()" />
                </div>
            </template>
        </div>
        <button class="update_word" @click="update_word">Aktualizuj Słowo</button>
    </div>
    `
}

const WordRow = {
    props:['type', 'word'],
    emits:['edit-request','delete-request'],
    computed:{
        pol_string(){
            return this.word.pol.join(',');
        },
    },
    methods:{
        edit_request(){
            this.$emit('edit-request');
        },
        delete_request(){
            this.$emit('delete-request');
        }
    },
    template: /*html*/`
        <div class="word_row" :class="type">
            <div class="ita">{{word.ita}}</div>
            <div class="pol">{{pol_string}}</div>
            <template v-if="type === 'noun'">
                <div class="case">{{word.true_case()}}</div>
                <div class="plural">{{word.true_plural()}}</div>
            </template>
            <template v-if="type === 'verb'">
                <div class="con">{{word.true_con()}}</div>
                <div class="verb_form verb_form_normal">{{word.true_form_normal().join(', ')}}</div>
            </template>
            <div class="edit" @click="edit_request">Edytuj</div>
            <div class="delete" @click="delete_request">Usuń</div>
        </div>
    `
};

///////// APP ////////////////


const RadioList = {
    props:[
        "option_values", "option", "soft_option"
    ],
    emits:[
        "update:option"
    ],
    methods:{
        set_option(value){
            console.log('OPT', this.option,  value);
            this.$emit("update:option", value);
        }
    },

    template: /*html*/`
    <div class="radio_list">
        <div v-for="[name, key, title] in option_values" 
            @click="set_option(key)"
            :title="title" 
            :class="{selected: option == key, soft_selected: soft_option == key}">
                {{name}}
        </div>
    </div>
    `
};

// app._instance.data.words.nouns.push(new WordNoun("casa", ["dom"]))

const app = Vue.createApp({
    created(){
        this.navs = [
            ['Opcje', 'options'],
            ['Słowa', 'words'],
            ['Test', 'test']
        ];
        this.questions_langs = [
            ['Polski', 'pol', 'Należy przetłumaczyć słowa z polskiego na włoski'],
            ['Włoski', 'ita', 'Należy przetłumaczyć słowa z włoskiego na polski'],
            ['Oba', 'all', 'Nalzeży przetłumaczyć słowa zarówno z polskiego i włoskiego na drugi język'],
        ];
        this.questions_pool_types = [
            ['Wszystkie', 'all', 'Słowa dobierane są losowo z wszystkich w bazie danych'],
            ['Krótkie Serie', 'batch', 'Słowa dobierane będą z mniejszych podzbiorów wszystkich słów. Dopiero po poprawnej odpowiedzi na wszystkie słowa z serii losowana jest nowa seria'],
        ];

    },
    mounted(){
        this.update_words_json(TEST_WORD_JSON);
        console.log("MOUNTED");
        APP_CTX = this;
    },
    data(){
        return {
            nav: 'options',
            options: {
                questions_lang: "all",
                questions_pool_type: "all",
                questions_pool_size: 0
            },
            words: {
                nouns: [],
                verbs: [],
            },
            current_list_word_type: 'noun',

            on_card_ref: null,
            on_card_type: "",
            word_to_insert: null,
        };
    },
    computed:{
        out_words_json(){
            return generate_words_json(this.words);
        },
        current_list_word_type_pol(){
            switch (this.current_list_word_type){
                case 'noun': return 'Rzeczownik';
                case 'verb': return 'Czasownik';
            }
        }
    },

    methods: {
        
        save_words(){
            const res = save_loacl_words_json(this.out_words_json);
            if(!res){console.log("Failed saving words");}
            return res;
        },
        export_words(){
            const res = export_words_json(this.out_words_json);
            if(!res){console.log("Failed exporting words");}
            return res;
        },
        import_words(){
            const json = prompt("Wklej JSON słów do zaimportowania", "");
            this.update_words_json(json);
        },

        update_words_json(words_json){
            this.words = parse_words_json(words_json);
        },

        set_on_card(type = '', word = {}){
            console.log("SET CARD", type, word.ita);
            this.on_card_ref = word;
            this.on_card_type = type;
        },
        update_on_card(type, word){
            console.log("UPD CARD", type, word.ita);
            for(let [key, value] of Object.entries(word)){
                this.on_card_ref[key] = value;
            }
            if(this.word_to_insert === this.on_card_ref){
                console.log("INS NEW", type, this.word_to_insert.ita);
                insert_word_sorted([this.words[type+'s']], this.word_to_insert);
                this.word_to_insert = null;
                return;
            }
        },
        delete_word(type, index){
            const words = this.words[type+'s'];
            const confirmation = window.confirm("Czy na pewno chcesz usunąć słowo '" + words[index].ita + "' ?");
            if(confirmation){
                words.splice(index, 1);
            }
        },
        add_word(type){
            this.word_to_insert = create_empty_word(type);
            this.set_on_card(type, this.word_to_insert);
            this.$nextTick(() => {
                console.log(this.$refs.word_card_elem);
                this.$refs.word_card_elem.focus_on_word();
            });
        },

        clicked_nav(value){
            console.log('NAV', value);
            this.nav = value;
        },

    },

    template: /*html*/`
    <header>

        <div v-for="[nav_name, nav_key] in navs" @click="clicked_nav(nav_key)" :class="{selected: nav === nav_key}">{{nav_name}}</div>

    </header>


    <main>

        <div id="nav_options" v-if="nav === 'options'">
            <fieldset>
                <legend title="Określa, w jakim języku podawane będą słowa, które należy przetłumaczyć">
                    Język pytań
                </legend>
                <RadioList v-model:option="options.questions_lang" :option_values="questions_langs" />
            </fieldset>
            
            <fieldset>
                <legend title="Określa, z jakiej puli dobierane będą słowa">
                    Pule Pytań
                </legend>
                <RadioList v-model:option="options.questions_pool_type" :option_values="questions_pool_types" />
                <p>Rozmiar puli: <input type="number" v-model="options.questions_pool_size" :disabled="options.questions_pool_type === 'all'"></p>
            </fieldset>
        </div>

        <div id="nav_words" v-if="nav === 'words'">

            <!-- <p  v-for="noun in words.nouns"
                :key="noun.ita+','+noun.pol[0]"
                @click="set_on_card('noun', noun)">
                {{noun.ita}} | {{noun.pol}} | {{noun.true_case()}} | {{noun.true_plural()}}
            </p> -->

            <!-- <button class="io_word"
                @click="save_words()"
                title="Zachowuje wprowadzone modyfikacje localnie">
                Zapisz listę słów
            </button> -->
            <button class="io_word"
                @click="export_words()">
                Eksportuj listę słów
            </button>
            <button class="io_word"
                @click="import_words()">
                Importuj listę słów
            </button>
            <RadioList 
                v-model:option="current_list_word_type"
                :option_values="[['Rzeczowniki', 'noun'], ['Czasowniki', 'verb']]"
            />

            <button class="add_word"
                @click="add_word(current_list_word_type)">
                + Nowy {{ current_list_word_type_pol }}
            </button>
            <div class="word_rows">
                <WordRow v-for="(noun, index) in words[current_list_word_type + 's']"
                    :type="current_list_word_type"
                    :word="noun"
                    @edit-request="set_on_card(current_list_word_type, noun)"
                    @delete-request="delete_word(current_list_word_type, index)"
                />
            </div>
            
            <!-- <button class="add_word"
                @click="add_word('verb')">
                + Nowy Czasownik
            </button>
            <div class="word_rows">
                <WordRow v-for="(verb, index) in words.verbs"
                    type="verb"
                    :word="verb"
                    @edit-request="set_on_card('verb', verb)"
                    @delete-request="delete_word('verb', index)"
                />
            </div> -->

            <p>
                {{out_words_json}}
            </p>

        </div>

    </main>

    <div class="cover" v-if="on_card_type !== ''" @click="set_on_card()">
        <WordCard 
            @click.stop=""
            :type='on_card_type'
            :key="on_card_ref?.ita" 
            :sourceWord="on_card_ref"
            @update-word="n => {update_on_card(on_card_type, n), set_on_card()}"
            ref="word_card_elem"
        />
    </div>

    `
});

app.component("RadioList", RadioList);
app.component("WordCard", WordCard);
app.component("WordRow", WordRow);

app.mount("#app");