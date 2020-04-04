//4.Remove and rewrite methods
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

    let todos = store("todos-jquery");
    app.todos = todos;

    //todo list raw template
    let element = document.querySelector('#todo-template');
    let source = element.innerHTML;
    app.todoTemplate = Handlebars.compile(source);

    //footer raw template
    let footerElement = document.querySelector('#footer-template')
    let footerSource = footerElement.innerHTML;
    app.footerTemplate = Handlebars.compile(footerSource);

    bindEvents();

    new Router({
      '/:filter' :  function (filter) {
        app.filter = filter
        render();
      }
    }).init('/all')
  }

  function bindEvents() {
  //create
  document.querySelector('#new-todo').addEventListener('keyup' , create)
  //toggle-all
  document.querySelector('#toggle-all').addEventListener('change' , toggleAll)
  //detroyCompleted
  document.querySelector('#footer').addEventListener('click' , function(e){
    if (e.target.id === 'clear-completed'){
      destroyCompleted();
    }
  })
  //todo-list
  document.querySelector('#todo-list').addEventListener('change' , function(e) {
    if (e.target.className === 'toggle'){
      toggle(e);
    }
  })
  //destroy
  document.querySelector('#todo-list').addEventListener('click' , function(e){
    if (e.target.className === 'destroy'){
      destroy(e);
    }
  })
  //edit 
  document.querySelector('#todo-list').addEventListener('dblclick' , function(e){
    if (e.target.localName === 'label'){
      edit(e);
    }
  })
  //editkeyup
  document.querySelector('#todo-list').addEventListener('keyup' , function(e){
    if (e.target.className === 'edit'){
      editKeyup(e);
    }
  })
  //update
  document.querySelector('#todo-list').addEventListener('focusout' , function(e){
    if (e.target.className === 'edit'){
      update(e);
    }
  })
  };

  function render() {
    let todos = getFilteredTodos(); 
    
    document.querySelector('#todo-list').innerHTML = app.todoTemplate(todos);

    if (app.todos.length > 0) {
      document.querySelector('#main').style.display = 'block'
    } else {
      document.querySelector('#main').style.display = 'none'
  };
  document.querySelector('#toggle-all').addEventListener('checked' , function() {
    getActiveTodos().length === 0;
  })
  renderFooter();
  document.querySelector('#new-todo').focus();
  store('todos-jquery' , app.todos)
}

    function renderFooter() {
    let todoCount = app.todos.length
    let activeTodoCount = getActiveTodos().length
  
  
  let template = app.footerTemplate({
    activeTodoCount : activeTodoCount,
    activeTodoWord : pluralize(activeTodoCount , 'item'),
    completedTodos : todoCount - activeTodoCount,
    filter : app.filter
  })

  if (todoCount > 0){
    document.querySelector('#footer').style.display = 'block';
    document.querySelector('#footer').innerHTML = template;
  } else {
    document.querySelector('#footer').style.display = 'none';
  }

  };
  
  function toggleAll(e) {
    let isClicked = e.target.checked

    app.todos.forEach(function (todo){
        todo.completed = isClicked;
      })
    render();
  };
  

  //filter in order to get (completed === false) property
  function getActiveTodos() {
    return app.todos.filter(function (todo) {
      return !todo.completed;
    })
  };
  
  function getCompletedTodos() {
    return app.todos.filter(function (todo){
      return todo.completed;
    })
  };
  
  //check filter object whether it is active or completed and then implement function
  function getFilteredTodos() {
    if (app.filter === 'active'){
      return getActiveTodos();
    }
    if (app.filter === 'completed'){
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

    let id = el.closest('li').getAttribute('data-id');
    let todos = app.todos
    let i = todos.length

    while (i--){
     if (todos[i].id === id){
       return i;
     }
    }
    render();
  };

  //activate when add item to list
  function create(e) {
    let input = document.querySelector('#new-todo')
    let val = input.value.trim();

    if (e.which !== ENTER_KEY || !val){
      return;
    }

    app.todos.push({
      id : uuid(),
      title : val,
      completed : false,
    })

    input.value = '';
    render()
  };


  function toggle(e) {
    let i = indexFromEl(e.target)

    app.todos[i].completed = !app.todos[i].completed;

    render();
    
  };

  //$input = jQuery.fn.init [input.edit, prevObject: jQuery.fn.init(1), context: label, selector: ".edit"]

  //when dbclick for editing
  function edit(e) {
  let elem = e.target
  let closestLi = elem.closest('li')
  closestLi.classList.add('editing')

  let input = closestLi.querySelector('.edit')
  input.focus();
  };
  
  
  function editKeyup(e) {
  // if Hit Enter make the box unhighlight
  if (e.which === ENTER_KEY) {
    e.target.blur();
  }
  //if Hit ESC make thr box un hightlight and set new attribute
  if (e.which === ESCAPE_KEY) {
    e.target.setAttribute('abort' , true);
    e.target.blur();
  }
  };
  
  function update(e) {
    let elem = e.target
    let val = elem.value.trim();

    if (!val) {
      destroy(e);
    }

    if (elem.getAttribute('abort')){
      elem.setAttribute('abort' , false)
    }
    else {
      app.todos[indexFromEl(elem)].title = val;
    }
    render();
  };

  //this may relate to delete button
  function destroy(e) {
    app.todos.splice(indexFromEl(e.target) , 1);
    render()

  }
  
  init();

  
/*
//App.init
//App.bindEvents
//App.render
//App.renderFooter**
//App.toggleAll **
//App.getActiveTodos
//App.getCompletedTodos
//App.getFilteredTodos
//App.destroyCompleted
//App.indexFromEl
//App.create
//App.toggle
//App.edit
//App.editKeyup
//App.update
//App.destroy 
*/
