
const WordRow = {
    props:['type', 'word'],
    emits:['edit-request','delete-request'],
    computed:{
        pol_string(){
            return this.word.pol.join(',');
        },
		incomplete(){
			console.log("WORDROW", this.type, this.word);
			return !this.word.is_complete();
		}
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
        <div class="word_row" :class="type,{incomplete}">
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
