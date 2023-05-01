
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
            set(value){ this.word.pol = sanitize_word_arr(value.split(',')); },
        },
        pol_plural_string:{
            get(){ return this.word.pol_plural.join(','); },
            set(value){ this.word.pol_plural = sanitize_word_arr(value.split(','));},
        },
		incomplete(){
			return !this.word.is_complete();
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
    <div class="word_card" :class="type,{incomplete}">
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
                    <span>Włoski - Liczba mnoga</span>
                    <input type="text" v-model="word.plural" :placeholder="word.true_plural()">
                </div>
				<div></div>
                <div>
                    <span>Polski - Liczba mnoga</span>
                    <input type="text" v-model="pol_plural_string">
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
