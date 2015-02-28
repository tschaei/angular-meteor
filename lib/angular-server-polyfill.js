/**
 * Created by netanel on 28/02/15.
 */
window = this;
window.location = {
  href : 'noop'
};
window.addEventListener = function() {

};

window.history = {
  state : {}
};

document = {
  createElement : function() {
    return {
      setAttribute : function(href) {

      },
      pathname : '/'
    };
  },
  addEventListener : function() {

  },
  querySelector : function() {
    return {};
  }
};
