
const WordRow = {
    props:['type', 'word', 'excluded'],
    emits:['edit-request','delete-request','exclude-request'],
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
        },
        exclude_request(to_excluded, range){
            // console.log('E', e); 
            this.$emit('exclude-request', [to_excluded, range]);
        }
    },
    template: /*html*/`
        <div class="word_row" :class="type,{incomplete: excluded}">
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
            <button class="edit" @click.prevent="e => {exclude_request(false, e.shiftKey)}">Test+</button>
            <button class="edit" @click.prevent="e => {exclude_request(true,  e.shiftKey)}">Test-</button>
            <button class="edit" @click.prevent="edit_request">Edytuj</button>
            <button class="delete" @click.prevent="delete_request">Usuń</button>
        </div>
    `
};
