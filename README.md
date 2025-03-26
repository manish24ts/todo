WhatsApp TODO Bot

A simple WhatsApp bot that helps you manage your to-do list and set reminders directly from WhatsApp using the whatsapp-web.js library.

Features

Add new TODO items

List all, completed, or pending TODOs

Mark TODOs as complete

Delete TODOs

Set reminders for specific tasks

Interactive help command

Prerequisites

Before running the bot, ensure you have the following installed:

Node.js (v14 or later)

WhatsApp Web account

Installation

Clone this repository:

git clone https://github.com/your-repo/whatsapp-todo-bot.git
cd whatsapp-todo-bot

Install dependencies:

npm install

Usage

Start the bot:

node index.js

Scan the QR code displayed in the terminal with your WhatsApp to log in.

Use the commands below to interact with the bot.

Commands

Command

Description

!todo add [task]

Add a new task

!todo list

List all tasks

!todo list done

List completed tasks

!todo list pending

List pending tasks

!todo complete [index]

Mark a task as completed

!todo delete [index]

Delete a task

!todo remind [task] at [time/date]

Set a reminder

!todo help

Show available commands

Example Usage
