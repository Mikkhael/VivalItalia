

/*
JSON Words format

Noun:[
    ita:string,
    pol:[string],
    pol_plural:[string],
    case:(f|m|o|"") // o = other, "" = regular
    plural:string // "" = regular
]
Verb:[
    ita:string,
    pol:[string],
    con: ("-" | "are" | "") // "" = autodetect regular
    forms:{
        normal:[
            String x6 // "" = regular (according to type) 
        ]
    }
]
Other:[
    ita:string,
    pol:[string]
]

*/

function animate_flash_via_transition(elem, value){
    elem.classList.remove("anim_flash_transition")
    elem.style.backgroundColor = value;
    setTimeout(() => {
        elem.classList.add("anim_flash_transition")
        elem.style.backgroundColor = "";
    }, 0)
}

let APP_CTX = null;
//////////////// CACHE //////////////

function put_to_local_storage(key, value){
    if(typeof value != "string"){
        console.error("BAD STRING FOR KEY: ", key, value);
        return false;
    }
    if(localStorage){
        localStorage.setItem(key, value)
        return true;
    }
    console.error("Local Storage not supported");
    return false;   
}

function get_from_local_storage(key, def = "{}"){
    return localStorage?.getItem(key) || def; 
}


//////////////// WORDS IMPORT/EXPORT and CACHE /////////////

const EMPTY_JSON = `{}`;
const custom_words_json_url  = SEARCH_PARAMS.get("words_url");
const default_words_json_url = "/test_words.json";
function fetch_words_json(url = default_words_json_url){
    //return new Promise.resolve(TEST_WORD_JSON);
    return fetch(url);
}
function get_loacal_words_json(){
    return get_from_local_storage("words_json", EMPTY_JSON);
}
function save_loacl_words_json(json){
    put_to_local_storage("words_json", json);
}
function encode_json(json){
    return "data:text/json;charset=utf-8," + encodeURIComponent(json);
}
function export_words_json(json){
    if(typeof json != "string"){
        console.error("BAD JSON");
        return false;
    }
    const data_url = encode_json(json);
    const a_elem = document.createElement('a');
    a_elem.setAttribute('href', data_url);
    a_elem.setAttribute("target", "about:blank");
    // a_elem.setAttribute('download', `words ${new Date().toISOString()}.json`);
    a_elem.click();
    return true;
}



///////////// OPTIONS CACHE ////////////

function save_options_cache(options){
    console.log("SAVE OPTIONS", options);
    const json = JSON.stringify(options);
    put_to_local_storage("options", json);
}
function load_options_cache(options){
    const json = get_from_local_storage("options", "{}");
    const new_options = JSON.parse(json);
    console.log("LOAD OPTIONS", new_options);
    Object.assign(options, new_options);
}

////////////// OTHER /////////////

////////// ACCENT //////////

const ACCENT_LOOKUP = {
    "a": "à",
    "e": "è",
    "i": "ì",
    "o": "ò",
    "u": "ù",
    "A": "À",
    "E": "È",
    "I": "Ì",
    "O": "Ò",
    "U": "Ù",
    "è": "é",
    "ò": "ó",
    "È": "É",
    "Ò": "Ó",
};

function handle_accent_event(event){
    if(try_append_accent(event.target)){
        // console.log(event);
        event.preventDefault();
        event.target.dispatchEvent(new InputEvent("input"));
    }
}

function try_append_accent(target){
    if(!target) return false;
    if(target.tagName !== "INPUT") return false;
    if(target.getAttribute("type") !== "text") return false;
    if(target.value.length <= 0) return false;
    const last_char = target.value[target.value.length - 1];
    const lookup_res = ACCENT_LOOKUP[last_char];
    if(!lookup_res) return false;
    target.value = target.value.slice(0, -1) + lookup_res;
    return true;
}



///////// APP ////////////////

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
        this.irregular_levels = [
            ['Brak', 0],
            ['Tylko Nieregularne', 1],
            ['Losowo', 2],
            ['Wszystkie', 3],
        ]

        this.true_falses = [
            ['Tak', true],
            ['Nie', false]
        ]

        this.test_pool_unpassed = [];
        this.test_unpassed = [];
    },
    mounted(){
        //this.update_words_json(TEST_WORD_JSON);
        this.update_words_json(EMPTY_JSON);
        fetch_words_json(custom_words_json_url || default_words_json_url).then(res => {
            return res.text();
        }).then(json => {
            this.update_words_json(json);
        }).catch(err => {
            console.log("FETCHING ERROR: ", err);
        });

        load_options_cache(this.options);

        document.addEventListener("keydown", (event) => {
            // console.log("KEY", event.key)
            if(event.key === this.options.accent_key){
                // console.log("ACCENT");
                handle_accent_event(event);
            }
        });

        console.log("MOUNTED");
        APP_CTX = this;
    },
    data(){
        return {
            nav: 'test',
            options: {
                lang: "all",
                pool_type: "all",
                pool_size: 0,
                do_nouns: true,
                do_verbs: true,
                do_other: true,
                nouns_plural_level: 3, // 0-none, 1-irregular, 2-random, 3-all
                verbs_con_level: 3,

                accent_key: "`",
            },
            test_started: false,
            test_is_all: false,
            test_bad: false,
            test_index: 0,
            test_question_ref: null,
            test_answer: "",
            test_log: "",

            words: {
                noun: [],
                verb: [],
                other:[],
            },
            current_list_word_type: 'noun',

            on_card_ref: null,
            on_card_type: "",
            word_to_insert: null,
        };
    },
    watch:{
        options:{
            handler(new_value){
                save_options_cache(new_value);
            },
            deep: true
        }
    },
    computed:{
        out_words_json(){
            return generate_words_json(this.words);
        },
        current_list_word_type_pol(){
            switch (this.current_list_word_type){
                case 'noun':  return 'Rzeczownik';
                case 'verb':  return 'Czasownik';
                case 'other': return 'Inne';
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
            if(json){
                this.update_words_json(json);
            }
        },

        update_words_json(words_json){
            this.words = parse_words_json(words_json);
        },

        set_on_card(type = '', word = {}){
            console.log("SET CARD", type, word.ita);
            this.on_card_ref = word;
            this.on_card_type = type;
            if(type !== ''){
                this.$nextTick(() => {
                    console.log(this.$refs.word_card_elem);
                    this.$refs.word_card_elem.focus_on_word();
                });
            }
        },
        set_on_card_next(type = '', offset){
            console.log("SET CARD NEXT", type, offset);
            const words = this.words[type];
            const index = words.indexOf(this.on_card_ref);
            if(index == -1){
                console.log("NOT FOUND");
            }
            let new_index = index + offset;
            if(new_index >= words.length) new_index = 0;
            if(new_index < 0) new_index = words.length-1;
            this.set_on_card(type, words[new_index]);
        },
        update_on_card(type, word){
            console.log("UPD CARD", type, word.ita);
            for(let [key, value] of Object.entries(word)){
                this.on_card_ref[key] = value;
            }
            if(this.word_to_insert === this.on_card_ref){
                console.log("INS NEW", type, this.word_to_insert.ita);
                insert_word_sorted([this.words[type]], this.word_to_insert);
                this.word_to_insert = null;
                return;
            }
        },
        delete_word(type, index){
            const words = this.words[type];
            const confirmation = window.confirm("Czy na pewno chcesz usunąć słowo '" + words[index].ita + "' ?");
            if(confirmation){
                words.splice(index, 1);
            }
        },
        add_word(type){
            this.word_to_insert = create_empty_word(type);
            this.set_on_card(type, this.word_to_insert);
            // this.$nextTick(() => {
            //     console.log(this.$refs.word_card_elem);
            //     this.$refs.word_card_elem.focus_on_word();
            // });
            this.save_words(); // TODO
        },

        ///////////////// TEST /////////////////


        next_question(){
            console.log("NEXT QUESTION");

            if(this.test_pool_unpassed.length == 0){
                const all_passed = this.regenerate_pool();
                if(all_passed){
                    console.log("ALL PASSED");
                    this.test_log = "Wszystkie wyrazy zostały odgadnięte !!!";
                    this.test_is_all = true;
                    return true;
                }
            }

            this.test_index = this.test_pool_unpassed.random_index();
            this.test_question_ref = this.test_pool_unpassed[this.test_index];
            if(!this.test_question_ref.generated){
                this.test_question_ref.generate();
            }
            this.test_answer = "";
            this.$nextTick(() => {
                this.$refs.answer_elem.focus();
            });
        },

        pass_question(correct){
            if(this.test_bad){
                this.test_bad = false;
                this.next_question();
                return;
            }
            if(correct){
                this.test_log = "Poprawnie";
                this.test_pool_unpassed.splice(this.test_index, 1);
                this.next_question();
                this.flash_green();
            }else{
                this.test_log = "Niepoprawnie";
                this.test_bad = true;
                this.falsh_red();
            }
            // this.test_index = -1;
            // this.test_question_ref = null;
        },

        check_answer(){
            const answer = this.test_answer.trim();
            const res = this.test_question_ref.check_answer(answer);
            this.pass_question(res);
        },

        regenerate_pool(){
            
            if(this.options.pool_type === "all"){
                this.test_pool_unpassed = this.test_unpassed;
                this.test_unpassed = [];
            }else{
                this.test_pool_unpassed = this.test_unpassed.extract_random(+this.options.pool_size);
            }
            console.log("REGENERATED", this.test_pool_unpassed, this.test_unpassed);
            return this.test_pool_unpassed.length === 0;
        },

        start_test(){
            this.test_started = true;
            this.test_bad = false;
            this.test_is_all = false;
            this.test_log = "";
            this.test_index = -1;
            this.test_question_ref = new TestQuestion();
            this.test_answer = "";
            this.test_pool_unpassed = [];

            const test_unpassed = [];

            if(this.options.do_nouns){
                const questions = convert_words_to_questions(this.words.noun, this.options);
                test_unpassed.push(...questions);
            }

            if(this.options.do_verbs){
                const questions = convert_words_to_questions(this.words.verb, this.options);
                test_unpassed.push(...questions);
            }

            if(this.options.do_other){
                const questions = convert_words_to_questions(this.words.other, this.options);
                test_unpassed.push(...questions);
            }
            

            this.test_unpassed = test_unpassed;
            console.log("STARTED", this.test_unpassed);
            this.next_question();
        },

        flash_green(){
            console.log("GREEN");
            animate_flash_via_transition(document.body, "#60f16e");
        },

        falsh_red(){
            console.log("RED");
            animate_flash_via_transition(document.body, "#f16060");
        },

        ////////////////////////////////////

        clicked_nav(value){
            console.log('NAV', value);
            this.nav = value;
            if(value != "test"){
                this.test_started = false;
            }
        },

    },

    template: /*html*/`
    <header>

        <div v-for="[nav_name, nav_key] in navs" @click="clicked_nav(nav_key)" :class="{selected: nav === nav_key}">{{nav_name}}</div>

    </header>


    <main>

        <div id="nav_options" class="options_container" v-if="nav === 'options'">
            <fieldset>
                <legend>
                    Ogólne
                </legend>
                <p>
                    Przycisk akcentu: 
                    <input v-model="options.accent_key" />
                    <br>
                    Można wstawiać włoskie akcenty nad samogłoskami jak [è] i [à], 
                    <b>bez potrzeby posiadania włsokiej klawiatury</b>. 
                    Można napisać literę bez akcentu, 
                    a następnie nacisnąć odpowiedni klawisz.
                    Aby wyknać akcent w prawą stronę, należy nacisnąć go dwukrotnie.
                    Domyślnie jest to "Backtick" (ten pod tyldą).
                </p>
            </fieldset>

            <fieldset>
                <legend title="Określa, w jakim języku podawane będą słowa, które należy przetłumaczyć">
                    Język pytań
                </legend>
                <RadioList v-model:option="options.lang" :option_values="questions_langs" />
            </fieldset>
            
            <fieldset>
                <legend title="Określa, z jakiej puli dobierane będą słowa">
                    Pule Pytań
                </legend>
                <RadioList v-model:option="options.pool_type" :option_values="questions_pool_types" />
                <p>Rozmiar puli: <input type="number" v-model="options.pool_size" :disabled="options.pool_type === 'all'" min="1"></p>
            </fieldset>
            
            <fieldset>
                <legend>
                    Rzeczowniki
                </legend>
                <p>
                    Testuj Rzeczowniki:
                    <RadioList v-model:option="options.do_nouns" :option_values="true_falses" />
                </p>
                <p>
                    Liczby parzyste:
                    <RadioList v-model:option="options.nouns_plural_level" :option_values="irregular_levels" />
                </p>
            </fieldset>

            <fieldset>
                <legend>
                    Czasowniki
                </legend>
                <p>
                    Testuj Czasowniki:
                    <RadioList v-model:option="options.do_verbs" :option_values="true_falses" />
                </p>
                <p>
                    Odmiana przez osoby:
                    <RadioList v-model:option="options.verbs_con_level" :option_values="irregular_levels" />
                </p>
            </fieldset>

            <fieldset>
                <legend>
                    Inne
                </legend>
                <p>
                    Testuj pozostałe wyrazy:
                    <RadioList v-model:option="options.do_other" :option_values="true_falses" />
                </p>
            </fieldset>
        </div>

        <div id="nav_words" v-if="nav === 'words'">

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
                :option_values="[['Rzeczowniki', 'noun'], ['Czasowniki', 'verb'], ['Inne', 'other']]"
            />

            <button class="add_word"
                @click="add_word(current_list_word_type)">
                + Nowy {{ current_list_word_type_pol }}
            </button>
            <div class="word_rows">
                <WordRow v-for="(word, index) in words[current_list_word_type]"
                    :type="current_list_word_type"
                    :word="word"
                    @edit-request="set_on_card(current_list_word_type, word)"
                    @delete-request="delete_word(current_list_word_type, index)"
                />
            </div>
            
            <p>
                {{out_words_json}}
            </p>

        </div>
        
        <div id="nav_test" class="test_container" v-if="nav === 'test'">

            <template v-if="test_started">

                <div v-if="test_is_all" class="questions_all_done">
                    Wszystkie wylosowane pytania zostały rozwiązane!
                </div>
                <div v-else class="question">
                    <span v-html="test_question_ref.question"></span>
                </div>

                <div class="question_info">
                    <span v-html="test_question_ref.info"></span>
                </div>

                <div class="answer_container">
                    
                    <input type="text" class="answer"
                            :class="{bad: test_bad}"
                            ref="answer_elem"
                            v-model="test_answer"
                            @keydown.enter="check_answer">
                    
                    <button class="quess_btn" @click="check_answer">Enter</button>
                </div>

                <div v-if="test_bad" class="test_bad_container">
                    <span v-html="test_question_ref.expected"></span>
                </div>

                <!-- <div class="question_log">
                    <span v-html="test_log"></span>
                </div> -->

            </template>
            <template v-else>
                <button class="new_test_btn"
                        @click="start_test()">
                    Rozpoczij Test
                </button>
            </template>


        </div>

    </main>

    <div class="cover" v-if="on_card_type !== ''" @click="set_on_card()">
        <WordCard 
            @click.stop=""
            :type='on_card_type'
            :key="on_card_ref?.ita" 
            :sourceWord="on_card_ref"
            @update-word="(n) =>        { update_on_card(on_card_type, n); set_on_card(); }"
            @request-add="(n) =>        { update_on_card(on_card_type, n); add_word(on_card_type);}"
            @change-word="([n, off]) => { update_on_card(on_card_type, n); set_on_card_next(on_card_type, off); }"
            @cancel="set_on_card()"
            ref="word_card_elem"
        />
    </div>

    `
});


app.component("RadioList", RadioList);
app.component("WordCard", WordCard);
app.component("WordRow", WordRow);

app.mount("#app");