(() => { 

  /**
   * Sets up data view selection popover
   */  
  App.initDataViewPopover = () => {
    var contentStr = '';
    contentStr += '<div class="btn btn-default" tab="demo">Demo data</div>';
    $('[data-toggle="popover"]').popover({placement:'bottom', content: contentStr, html:true})
  };
})();
