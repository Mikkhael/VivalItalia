

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
    type: ("nonregular", "are")
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
    words_data.nouns = parse_words_data_nouns(words_data.nouns);

    return words_data;
}

function generate_words_json(words_data){
    let words_json = JSON.stringify(words_data);
    return words_json;
}

function parse_words_data_nouns(nouns){
    return nouns.map(noun => new WordNoun(
        noun.ita,
        noun.pol,
        noun.case,
        noun.plural
    ));
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

    true(){
        return new WordNoun(
            this.ita,
            this.pol,
            this.true_case(),
            this.true_plural()
        );
    }
}


//// VERBS


// TODO



///////// WORD COMPONENTS /////////

const NounCard = {
    props:[
        "sourceWord"
    ],
    emits:[
        "update-word"
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
        }
    },
    template: /*html*/`
    <div class="word_card noun">
        <div class="word_options">
            <div class="main">
                <span>Słowo</span>
                <input type="text" v-model="word.ita">
            </div>
            <div class="main">
                <span title="Jeśli jest wiele dopiszczalnych tłumaczeń, można podać wszystkie, oddzielając przecinkami">Tłumaczenia</span>
                <input type="text" v-model="pol_string">
            </div>
            <div>
                <span>Rodzaj</span>
                <RadioList v-model:option="word.case" :option_values="[['Auto',''],['Męski','m'],['Żeński','f']]" :soft_option="word.true_case()" />
            </div>
            <div>
                <span>Liczba mnoga</span>
                <input type="text" v-model="word.plural" :placeholder="word.true_plural()">
            </div>
        </div>
        <button class="update_word" @click="update_word">Aktualizuj Słowo</button>
    </div>
    `
}

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


const TEST_WORD_JSON = `
    {
        "nouns": [
            {"ita": "gatto", "pol":["kot", "kocur"]},
            {"ita": "amico", "pol":["przyjaciel"], "plural":"amici"},
            {"ita": "amica", "pol":["przyjaciułka"]},
            {"ita": "cane", "pol":["pies"], "case":"m"}
        ]
    }
`;

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
    },
    data(){
        return {
            nav: 'options',
            options: {
                questions_lang: "all",
                questions_pool_type: "all",
                questions_pool_size: 0
            },
            words: {nouns: []},
            
            on_card_ref: null,
            on_card_type: "",
        };
    },
    computed:{
        out_words_json(){
            return generate_words_json(this.words);
        }
    },

    methods: {
        
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

            <p  v-for="noun in words.nouns"
                :key="noun.ita+','+noun.pol[0]"
                @click="set_on_card('noun', noun)">
                {{noun.ita}} | {{noun.pol}} | {{noun.true_case()}} | {{noun.true_plural()}}
            </p>

            <p>
                {{out_words_json}}
            </p>

        </div>

    </main>

    <div class="cover" v-if="on_card_type !== ''" @click="set_on_card()">
        <NounCard 
            @click.stop=""
            :key="on_card_ref?.ita" 
            v-if="on_card_type === 'noun'" 
            :sourceWord="on_card_ref"
            @update-word="n => {update_on_card('noun', n), set_on_card()}" />
    </div>

    `
});

app.component("RadioList", RadioList);
app.component("NounCard", NounCard);

app.mount("#app");