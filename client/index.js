const Balloon = {
    template: `<div class="conversation-balloon" :class="speaker">
    <div class="avatar">
      <img :src="profile_picture">
      <p class="name">{{ name }}</p>
    </div>
    <p class="message">{{ message }}</p>
  </div>`,
    props: {
      name: {
        type: String,
        required: true
      },
      speaker: {
        type: String,
        required: true,
        validator: value => {
          return ['my', 'other'].includes(value);
        }
      },
      message: {
        type: String,
        required: true
      },
      profile_picture: {
        type: String,
        required: true
      }
    }
  };
  
  const ChatForm = {
    template: `<div class="chat-form">
    <div class="form-container">
      <input type="text" class="message" v-model="message" v-on:keyup.enter="submit">
      <button class="submit" @click="submit">send</button>
    </div>
  </div>`,
    props: {
      applyEvent: {
        type: String,
        required: true
      }
    },
    data () {
      return {
        message: ''
      }
    },
    methods: {
      submit () {
        this.$emit(this.applyEvent, this.message)
        this.message = '';
      }
    }
  };
  
  const app = new Vue({
    el: '#app',
    components: {
      balloon: Balloon,
      chatForm: ChatForm
    },
    data () {
      return {
          currentUser: {
            name: null,
            profile_picture: null
          },
          connection: null,
          chatLogs: []
      }
    },
    created: function() {
        let self = this;
        fetch('https://randomuser.me/api').then(res => res.json()).then(data => {
            console.log(data)
            let user = `${data.results[0].name.first} ${data.results[0].name.last}`
            let profile_picture = data.results[0].picture.thumbnail
            self.currentUser.name = user
            self.currentUser.profile_picture = profile_picture
            self.submitChat("You have joined the chat", user, profile_picture, true)
            let urlParams = new URLSearchParams({
                user,
                profile_picture
            });
            self.connection = new WebSocket(`ws://localhost:8282/ws?${urlParams.toString()}`)
            
            self.connection.onmessage = function(event) {
              let message = JSON.parse(event.data)
              if(message.user != self.currentUser.name) self.submitChat(message.message, message.user, message.profile_picture)
            }
        
            self.connection.onopen = function(event) {
              console.log(event)
              console.log("Successfully connected to the echo websocket server...")
            }
        })

        
    },
    methods: {
      submit (value) {
        this.chatLogs.push({
          name: `You (${this.currentUser.name})`,
          profile_picture: this.currentUser.profile_picture,
          speaker: 'my',
          message: value
        });
        console.log('running')
        this.connection.send(value)
        this.scrollDown();
      },
      submitChat (value, name, profile_picture, self = false) {
        this.chatLogs.push({
          name: name,
          profile_picture: profile_picture,
          speaker: self?'my': 'other',
          message: value
        });
        
        this.scrollDown();
      },
      scrollDown () {
        const target = this.$el.querySelector('.chat-timeline');
        setTimeout(() => {
            const height = target.scrollHeight - target.offsetHeight;
          target.scrollTop += 10;
  
          if (height <= target.scrollTop) {
            return;
          } else {
            this.scrollDown();
          }
        }, 0);
      }
    }
  });