const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');

class WhatsAppTODOBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        // Store TODOs with more details
        this.todos = new Map();
        
        // Store reminders
        this.reminders = new Map();

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code to log in to WhatsApp');
        });

        this.client.on('ready', () => {
            console.log('WhatsApp TODO Bot is ready!');
        });

        this.client.on('message', async (message) => {
            const chat = await message.getChat();
            const body = message.body.trim().toLowerCase();

            // TODO Add commands
            if (body.startsWith('!todo add ')) {
                this.addTODO(chat, body.replace('!todo add ', '').trim());
            } 
            // TODO List commands
            else if (body.startsWith('!todo list')) {
                if (body.includes('done')) {
                    this.listTODOs(chat, true);
                } else if (body.includes('pending')) {
                    this.listTODOs(chat, false);
                } else {
                    this.listTODOs(chat);
                }
            } 
            // TODO Mark as complete
            else if (body.startsWith('!todo complete ')) {
                const index = parseInt(body.replace('!todo complete ', '').trim());
                this.completeTODO(chat, index);
            } 
            // TODO Delete commands
            else if (body.startsWith('!todo delete ')) {
                const index = parseInt(body.replace('!todo delete ', '').trim());
                this.deleteTODO(chat, index);
            } 
            // TODO Set Reminder
            else if (body.startsWith('!todo remind ')) {
                const reminderDetails = body.replace('!todo remind ', '').trim();
                this.setReminder(chat, reminderDetails);
            } 
            // Help command
            else if (body === '!todo help') {
                this.sendHelp(chat);
            }
        });
    }

    addTODO(chat, task) {
        if (!this.todos.has(chat.id.user)) {
            this.todos.set(chat.id.user, []);
        }
        
        const userTodos = this.todos.get(chat.id.user);
        const newTodo = {
            task: task,
            createdAt: new Date(),
            completedAt: null,
            completed: false,
            priority: 'medium' // Default priority
        };

        userTodos.push(newTodo);
        chat.sendMessage(`TODO added: ${task}`);
    }

    listTODOs(chat, filterType = null) {
        const userTodos = this.todos.get(chat.id.user) || [];
        
        if (userTodos.length === 0) {
            chat.sendMessage('No TODOs found. Use !todo add [task] to create a new todo.');
            return;
        }

        let todoList = '';
        if (filterType === true) {
            todoList = 'Completed TODOs:\n';
            const completedTodos = userTodos.filter(todo => todo.completed);
            
            if (completedTodos.length === 0) {
                chat.sendMessage('No completed TODOs found.');
                return;
            }

            completedTodos.forEach((todo, index) => {
                todoList += `${index + 1}. ✅ ${todo.task} (Completed on: ${todo.completedAt.toLocaleString()})\n`;
            });
        } else if (filterType === false) {
            todoList = 'Pending TODOs:\n';
            const pendingTodos = userTodos.filter(todo => !todo.completed);
            
            if (pendingTodos.length === 0) {
                chat.sendMessage('No pending TODOs found.');
                return;
            }

            pendingTodos.forEach((todo, index) => {
                todoList += `${index + 1}. ❌ ${todo.task}\n`;
            });
        } else {
            todoList = 'Your TODOs:\n';
            userTodos.forEach((todo, index) => {
                const status = todo.completed ? '✅' : '❌';
                todoList += `${index + 1}. ${status} ${todo.task}\n`;
            });
        }

        chat.sendMessage(todoList);
    }

    completeTODO(chat, index) {
        const userTodos = this.todos.get(chat.id.user) || [];
        
        if (index < 1 || index > userTodos.length) {
            chat.sendMessage('Invalid TODO index. Use !todo list to see your TODOs.');
            return;
        }

        const todoToComplete = userTodos[index - 1];
        
        if (todoToComplete.completed) {
            chat.sendMessage('This TODO is already completed.');
            return;
        }

        todoToComplete.completed = true;
        todoToComplete.completedAt = new Date();
        
        chat.sendMessage(`Completed TODO: ${todoToComplete.task}`);
    }

    deleteTODO(chat, index) {
        const userTodos = this.todos.get(chat.id.user) || [];
        
        if (index < 1 || index > userTodos.length) {
            chat.sendMessage('Invalid TODO index. Use !todo list to see your TODOs.');
            return;
        }

        const deletedTodo = userTodos.splice(index - 1, 1)[0];
        chat.sendMessage(`Deleted TODO: ${deletedTodo.task}`);
    }

    setReminder(chat, reminderDetails) {
        // Parse reminder details
        // Format: [task] at [time/date]
        const parts = reminderDetails.split(' at ');
        if (parts.length !== 2) {
            chat.sendMessage('Invalid reminder format. Use: !todo remind [task] at [time/date]');
            return;
        }

        const task = parts[0];
        const reminderTime = new Date(parts[1]);

        if (isNaN(reminderTime.getTime())) {
            chat.sendMessage('Invalid date/time format. Use a valid date and time.');
            return;
        }

        // Store reminder
        if (!this.reminders.has(chat.id.user)) {
            this.reminders.set(chat.id.user, []);
        }
        
        const userReminders = this.reminders.get(chat.id.user);
        
        // Schedule reminder
        const job = schedule.scheduleJob(reminderTime, () => {
            chat.sendMessage(`⏰ Reminder: ${task}`);
        });

        userReminders.push({
            task: task,
            time: reminderTime,
            job: job
        });

        chat.sendMessage(`Reminder set for ${task} at ${reminderTime.toLocaleString()}`);
    }

    sendHelp(chat) {
        const helpMessage = `WhatsApp TODO Bot Commands:
• !todo add [task] - Add a new TODO
• !todo list - List all TODOs
• !todo list done - List completed TODOs
• !todo list pending - List pending TODOs
• !todo complete [index] - Mark a TODO as completed
• !todo delete [index] - Delete a TODO by its index
• !todo remind [task] at [time/date] - Set a reminder
• !todo help - Show this help message

Reminder Format Examples:
• !todo remind Buy groceries at 2024-03-27 18:30
• !todo remind Team meeting at "March 28, 2024 09:00"`;

        chat.sendMessage(helpMessage);
    }

    initialize() {
        this.client.initialize();
    }
}

// Create and initialize the bot
const todoBotInstance = new WhatsAppTODOBot();
todoBotInstance.initialize();
