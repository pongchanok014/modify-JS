//3. Remove jQuery
/*global jQuery, Handlebars, Router */
  'use strict';
  
	Handlebars.registerHelper('eq', function (a, b, options) {
    return a === b ? options.fn() : options.inverse();
	});
  
	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
  var app = {}
  

		function uuid() {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}
			return uuid;
    };
    

		function pluralize(count, word) {
			return count === 1 ? word : word + 's';
    };
    
		function store(namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}

  //app is an initlalize object
  
		function init() {

			//create new object todos to app  =>  app = {todos : []}
			app.todos = store('todos-jquery');

			//without jquery
			let templateElement = document.querySelector('#todo-template');
			let source = templateElement.innerHTML;
			app.todoTemplate = Handlebars.compile(source);
			
			let footerTempleteElement = document.querySelector('#footer-template');
			let footerSource = footerTempleteElement.innerHTML;
			app.footerTemplate = Handlebars.compile(footerSource);
			bindEvents();

			//with jquery
			// app.todoTemplate = Handlebars.compile($('#todo-template').html());
			// app.footerTemplate = Handlebars.compile($('#footer-template').html());

			new Router({
				'/:filter': function (filter) {
					//create new object filter to app  =>  app = {filter : []}
					app.filter = filter;
					render();
				}
			}).init('/all');
    };
    
		function bindEvents() {
			document.querySelector('#new-todo').addEventListener('keyup' , create)
			document.querySelector('#toggle-all').addEventListener('change' , toggleAll)
			document.querySelector('#footer').addEventListener('click', function(e){
				if(e.target.id === 'clear-completed'){
          destroyCompleted();
        }
			})
			document.querySelector('#todo-list').addEventListener('change', function(e){
					if (e.target.className ==='toggle') {
						toggle(e);
					}
				})
				// label is not a class but element name so we have to use .localName
				document.querySelector('#todo-list').addEventListener('dblclick', function(e){
					if (e.target.localName ==='label') {
						edit(e);
					}
				})			
				document.querySelector('#todo-list').addEventListener('keyup', function(e){
					if (e.target.className ==='edit') {
						editKeyup(e);
					}
				})				

				document.querySelector('#todo-list').addEventListener('focusout', function(e){
					if (e.target.className ==='edit') {
						update(e);
					}
				})
				document.querySelector('#todo-list').addEventListener('click', function(e){
					if (e.target.className ==='destroy') {
						destroy(e);
					}
				})		
				//use jQuery
			// $('#new-todo').on('keyup', create);
			// $('#toggle-all').on('change', toggleAll);
			// $('#footer').on('click', '#clear-completed', destroyCompleted);
			// $('#todo-list')
			// 	.on('change', '.toggle', toggle)
			// 	.on('dblclick', 'label', edit)
			// 	.on('keyup', '.edit', editKeyup)
			// 	.on('focusout', '.edit', update)
			// 	.on('click', '.destroy', destroy);
		};

		function render() {
			
			var todos = getFilteredTodos();
			document.querySelector('#todo-list').innerHTML = app.todoTemplate(todos);	
			
			if (todos.length > 0){
				document.querySelector('#main').style.display = 'block'
			} else {
				document.querySelector('#main').style.display = 'none';
			}
			
			document.querySelector('#toggle-all').addEventListener('checked', function (){ getActiveTodos().length === 0});			
			renderFooter();
			document.querySelector('#new-todo').focus();
			store('todos-jquery', app.todos);

			// $('#todo-list').html(app.todoTemplate(todos));
			// $('#main').toggle(todos.length > 0);
			// $('#toggle-all').prop('checked', getActiveTodos().length === 0);
			// renderFooter();
			
    };
    
		function renderFooter() {
			var todoCount = app.todos.length;
			var activeTodoCount = getActiveTodos().length;
			var template = app.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: app.filter
			});
			
			//$('#footer').toggle(todoCount > 0).html(template);
			if (todoCount > 0) {
			document.querySelector('#footer').style.display = 'block';
			document.querySelector('#footer').innerHTML = template;
			} else {
			document.querySelector('#footer').style.display = 'none';
			}
			
    };
    
		function toggleAll(e) {
			var isChecked = e.target.checked;
			// toggle-all button is a checkbox  
			// if checked then =>true

			//var isChecked = $(e.target).prop('checked');
			app.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});
			render();
    };
		

		//filter in order to get (completed === false) property
		function getActiveTodos() {
			return app.todos.filter(function (todo) {
				return !todo.completed;
			});
    };
    
		function getCompletedTodos() {
			return app.todos.filter(function (todo) {
				return todo.completed;
			});
		};
		
    //check filter object whether it is active or completed and then implement function
		function getFilteredTodos() {
			if (app.filter === 'active') {
				return getActiveTodos();
			}

			if (app.filter === 'completed') {
				return getCompletedTodos();
			}

			return app.todos;
		};

		
		function destroyCompleted() {
			app.todos = getActiveTodos();
			app.filter = 'all';
			render();
		};
		
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		function indexFromEl(el) {
		var id = el.closest('li').getAttribute('data-id');
		// var id = $(el).closest('li').data('id');
			var todos = app.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		};
		//activate when add item to list
		function create(e) {
			var input = document.querySelector('#new-todo')
			var val = input.value.trim();

			//var $input = $(e.target);
			//var val = $input.val().trim();

			//if (e.which !== ENTER_KEY || !val) {
			if (e.which !== ENTER_KEY || !val) {
				return;
			}

      //create todos array within app object
			app.todos.push({
				id: uuid(),
				title: val,
				completed: false
			});

			input.value = '';

			render();
		};


		function toggle(e) {
			var i = indexFromEl(e.target);
			app.todos[i].completed = !app.todos[i].completed;
			render();
		};

		//$input = jQuery.fn.init [input.edit, prevObject: jQuery.fn.init(1), context: label, selector: ".edit"]

		//when dbclick for editing
		function edit(e) {
			// e.target.closest('li').classList.add('editing').querySelector('.edit')
			//break into small pieces can help you understand when
			var targetEle = e.target //label
			let closestLi = targetEle.closest('li')
			closestLi.classList.add('editing');

			// input is for targeting class name (.edit ) from closest li
			let input = closestLi.querySelector('.edit')		
			input.focus();

			// var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			// $input.val($input.val()).focus();
    };
    
		function editKeyup(e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				e.target.setAttribute('abort', true)
				e.target.blur();
				//$(e.target).data('abort', true).blur();
			}
    };
    
		function update(e) {
			var el = e.target;
			//var $el = $(el);
			var val = el.value.trim();

			if (!val) {
				destroy(e);
				return;
			}

			if (el.getAttribute('abort')) {
				el.setAttribute('abort', false);
			} else {
				app.todos[indexFromEl(el)].title = val;
			}
			render();
    };
    
		//this may relate to delete button
		function destroy(e) {
			app.todos.splice(indexFromEl(e.target), 1);
			render();
    }
    
    init();


