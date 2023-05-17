
const WordCard = {
    props:[
        "type",
        "sourceWord"
    ],
    emits:[
        "update-word",
		"cancel",
		"change-word",
		"request-add",
        "delete_word"
    ],
    data(){
        return{
            word: this.sourceWord.clone(),
            pol_string: this.sourceWord.pol?.join(',') || "",
            pol_plural_string: this.sourceWord.pol_plural?.join(',') || "",
        };
    },
    watch:{
        pol_string(newValue) {
            this.word.pol = sanitize_word_arr(newValue.split(','));
        },
        pol_plural_string(newValue) {
            this.word.pol_plural = sanitize_word_arr(newValue.split(','));
        },
    },
    computed:{
		incomplete(){
			return !this.word.is_complete();
		},
    },
    methods:{
		force_update(){
			this.word = this.sourceWord.clone();
		},
        update_word(){
			console.log("UPDATE-WORD")
            this.$emit('update-word', this.word.clone());
        },
        change_word(off){
			console.log("CHANGE-WORD", off)
            this.$emit('change-word', [this.word.clone(), off]);
        },
		request_add(){
			console.log("REQUEST-ADD");
			this.$emit("request-add", this.word.clone());
		},
        cancel(){
            this.$emit('cancel');
        },
        focus_on_word(){
            this.$refs.word_ita_input.focus();
        }
    },
    template: /*html*/`
    <div class="word_card" :class="type,{incomplete}"
		@keydown.enter.shift.prevent="request_add"
		@keydown.enter.ctrl.prevent="update_word"
		@keydown.right.alt.prevent="change_word(1)"
		@keydown.left.alt.prevent="change_word(-1)"
		@keydown.escape="cancel">
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
                    <span>Polski - Liczba mnoga</span>
                    <input type="text" v-model="pol_plural_string">
                </div>
                <div>
                    <span>Rodzaj</span>
                    <RadioList v-model:option="word.case" :option_values="[['Auto',''],['Męski','m'],['Żeński','f']]" :soft_option="word.true_case()" />
                </div>
                <div>
                    <span>Włoski - Liczba mnoga</span>
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
                    <RadioList v-model:option="word.con" :option_values="[['Auto',''],['Inne','-'],['-are','are'],['-ere','ere'],['-ire','ire']]" :soft_option="word.true_con()" />
                </div>
            </template>
        </div>
        <button class="update_word" @click="update_word">Aktualizuj Słowo</button>
		<p class="manual">
			<p><b>ENTER + CTRL</b> : zatwierdź zmiany</p>
			<p><b>ENTER + SHIFT</b> : zatwierdź zmiany i dodaj nowe słowo</p>
			<p><b>ALT + RIGHT_ARROW</b> : zatwierdź zmiany i przejdź do kolejnego słowa</p>
			<p><b>ALT + LEFT_ARROW </b> : zatwierdź zmiany i przejdź do poprzedniego słowa</p>
			<p><b>ESCAPE</b> : porzuć zmiany</p>
		</p>
    </div>
    `
}
