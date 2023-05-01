
///// OTHER

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
