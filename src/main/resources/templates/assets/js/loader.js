(function($) {
  var init;
  init = function() {

    /* LOADER MODAL FOR TEAM MEMBERS, SHOWCASE, PORTFOLIO AND BLOG SECTIONS */
    var $loaderModal, loader, loaderLauncher, loaderModal;
    loader = new SVGLoader(document.getElementById('loader'), {
      speedIn: 250,
      easingIn: mina.easeinout
    });
    loaderModal = document.querySelector(".loader-modal");
    $loaderModal = $(loaderModal);
    $loaderModal.on("click", ".close-handle", function(e) {
      $loaderModal.scrollTop(0);
      $loaderModal.fadeOut(250, function() {
        return $loaderModal.attr('class', 'loader-modal');
      });
    });
    loaderLauncher = function(content, className, inject) {
      var contentType;
      if (typeof content === "string") {
        contentType = content.match(/\.(md|htm[l]?|php)(\?.*)?$/);
        contentType = contentType[1];
      } else if (typeof Node === "object" && content instanceof Node || typeof content === "object" && typeof content.nodeType === "number" && typeof content.nodeName === "string") {
        contentType = "element";
      } else {
        return "Error: Unknown content type.";
      }
      loader.show();
      setTimeout(function() {
        if (className !== 'undefined') {
          $loaderModal.addClass(className);
        }
        $loaderModal.html('').append($("<span class='close-handle' />"));
        if (contentType === "md") {
          return $.ajax({
            url: content,
            error: function(data) {
              return $loaderModal.append(themeConfig.ajaxErrorMessage.open + content + themeConfig.ajaxErrorMessage.close).fadeIn(250, function() {
                return loader.hide();
              });
            },
            success: function(data) {
              var converter;
              converter = new Markdown.Converter();
              data = converter.makeHtml(data);
              return $loaderModal.append(data).fadeIn(250, function() {
                return loader.hide();
              });
            }
          });
        } else if (contentType === "html" || contentType === "htm" || contentType === "php") {
          return (function(content, inject) {
            return $.ajax({
              url: content,
              error: function(data) {
                return $loaderModal.append(themeConfig.ajaxErrorMessage.open + content + themeConfig.ajaxErrorMessage.close).fadeIn(250, function() {
                  return loader.hide();
                });
              },
              success: function(data) {
                var injectable, window_height;
                window_height = $(window).height();
                injectable = $(data).find(".main").addClass('ajaxed secondary_section').css("min-height", window_height);
                return $loaderModal.append(injectable).fadeIn(250, function() {
                  loader.hide();
                  return (function(selector) {
                    if (!(themeConfig['GENERAL'].enable3DLinks || document.body.style['webkitPerspective'] !== void 0 || document.body.style['MozPerspective'] !== void 0)) {
                      return;
                    }
                    _p.slice(document.querySelectorAll('a.roll')).forEach(function(a) {
                      a.innerHTML = '<span data-title="' + a.text + '">' + a.innerHTML + '</span>';
                    });
                  })();
                });
              }
            });
          })(content, inject);
        } else if (contentType === "element") {
          return $loaderModal.append($(content).html()).fadeIn(250, function() {
            return loader.hide();
          });
        }
      }, 1000);
    };

    /* SECTION: TEAM */
    return $(".team_member .linkify").on("click", function(e) {
      var content;
      e.preventDefault();
      _p.debugLog("Class 'ajax-call' detected.");
      content = themeConfig["TEAM_MEMBERS"].dir + e.currentTarget.href;
      return loaderLauncher(content, "loader-modal-content");
    });
  };
  return (document.getElementById('loader')) && (document.querySelector(".loader-modal")) && init();
})(jQuery);

//# sourceMappingURL=loader.js.map