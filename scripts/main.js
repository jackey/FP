// Mustache.js template Engine
(function(global,factory){if(typeof exports==="object"&&exports){factory(exports)}else if(typeof define==="function"&&define.amd){define(["exports"],factory)}else{factory(global.Mustache={})}})(this,function(mustache){var Object_toString=Object.prototype.toString;var isArray=Array.isArray||function(object){return Object_toString.call(object)==="[object Array]"};function isFunction(object){return typeof object==="function"}function escapeRegExp(string){return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}var RegExp_test=RegExp.prototype.test;function testRegExp(re,string){return RegExp_test.call(re,string)}var nonSpaceRe=/\S/;function isWhitespace(string){return!testRegExp(nonSpaceRe,string)}var entityMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};function escapeHtml(string){return String(string).replace(/[&<>"'\/]/g,function(s){return entityMap[s]})}var whiteRe=/\s*/;var spaceRe=/\s+/;var equalsRe=/\s*=/;var curlyRe=/\s*\}/;var tagRe=/#|\^|\/|>|\{|&|=|!/;function parseTemplate(template,tags){if(!template)return[];var sections=[];var tokens=[];var spaces=[];var hasTag=false;var nonSpace=false;function stripSpace(){if(hasTag&&!nonSpace){while(spaces.length)delete tokens[spaces.pop()]}else{spaces=[]}hasTag=false;nonSpace=false}var openingTagRe,closingTagRe,closingCurlyRe;function compileTags(tags){if(typeof tags==="string")tags=tags.split(spaceRe,2);if(!isArray(tags)||tags.length!==2)throw new Error("Invalid tags: "+tags);openingTagRe=new RegExp(escapeRegExp(tags[0])+"\\s*");closingTagRe=new RegExp("\\s*"+escapeRegExp(tags[1]));closingCurlyRe=new RegExp("\\s*"+escapeRegExp("}"+tags[1]))}compileTags(tags||mustache.tags);var scanner=new Scanner(template);var start,type,value,chr,token,openSection;while(!scanner.eos()){start=scanner.pos;value=scanner.scanUntil(openingTagRe);if(value){for(var i=0,valueLength=value.length;i<valueLength;++i){chr=value.charAt(i);if(isWhitespace(chr)){spaces.push(tokens.length)}else{nonSpace=true}tokens.push(["text",chr,start,start+1]);start+=1;if(chr==="\n")stripSpace()}}if(!scanner.scan(openingTagRe))break;hasTag=true;type=scanner.scan(tagRe)||"name";scanner.scan(whiteRe);if(type==="="){value=scanner.scanUntil(equalsRe);scanner.scan(equalsRe);scanner.scanUntil(closingTagRe)}else if(type==="{"){value=scanner.scanUntil(closingCurlyRe);scanner.scan(curlyRe);scanner.scanUntil(closingTagRe);type="&"}else{value=scanner.scanUntil(closingTagRe)}if(!scanner.scan(closingTagRe))throw new Error("Unclosed tag at "+scanner.pos);token=[type,value,start,scanner.pos];tokens.push(token);if(type==="#"||type==="^"){sections.push(token)}else if(type==="/"){openSection=sections.pop();if(!openSection)throw new Error('Unopened section "'+value+'" at '+start);if(openSection[1]!==value)throw new Error('Unclosed section "'+openSection[1]+'" at '+start)}else if(type==="name"||type==="{"||type==="&"){nonSpace=true}else if(type==="="){compileTags(value)}}openSection=sections.pop();if(openSection)throw new Error('Unclosed section "'+openSection[1]+'" at '+scanner.pos);return nestTokens(squashTokens(tokens))}function squashTokens(tokens){var squashedTokens=[];var token,lastToken;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];if(token){if(token[0]==="text"&&lastToken&&lastToken[0]==="text"){lastToken[1]+=token[1];lastToken[3]=token[3]}else{squashedTokens.push(token);lastToken=token}}}return squashedTokens}function nestTokens(tokens){var nestedTokens=[];var collector=nestedTokens;var sections=[];var token,section;for(var i=0,numTokens=tokens.length;i<numTokens;++i){token=tokens[i];switch(token[0]){case"#":case"^":collector.push(token);sections.push(token);collector=token[4]=[];break;case"/":section=sections.pop();section[5]=token[2];collector=sections.length>0?sections[sections.length-1][4]:nestedTokens;break;default:collector.push(token)}}return nestedTokens}function Scanner(string){this.string=string;this.tail=string;this.pos=0}Scanner.prototype.eos=function(){return this.tail===""};Scanner.prototype.scan=function(re){var match=this.tail.match(re);if(!match||match.index!==0)return"";var string=match[0];this.tail=this.tail.substring(string.length);this.pos+=string.length;return string};Scanner.prototype.scanUntil=function(re){var index=this.tail.search(re),match;switch(index){case-1:match=this.tail;this.tail="";break;case 0:match="";break;default:match=this.tail.substring(0,index);this.tail=this.tail.substring(index)}this.pos+=match.length;return match};function Context(view,parentContext){this.view=view;this.cache={".":this.view};this.parent=parentContext}Context.prototype.push=function(view){return new Context(view,this)};Context.prototype.lookup=function(name){var cache=this.cache;var value;if(name in cache){value=cache[name]}else{var context=this,names,index,lookupHit=false;while(context){if(name.indexOf(".")>0){value=context.view;names=name.split(".");index=0;while(value!=null&&index<names.length){if(index===names.length-1&&value!=null)lookupHit=typeof value==="object"&&value.hasOwnProperty(names[index]);value=value[names[index++]]}}else if(context.view!=null&&typeof context.view==="object"){value=context.view[name];lookupHit=context.view.hasOwnProperty(name)}if(lookupHit)break;context=context.parent}cache[name]=value}if(isFunction(value))value=value.call(this.view);return value};function Writer(){this.cache={}}Writer.prototype.clearCache=function(){this.cache={}};Writer.prototype.parse=function(template,tags){var cache=this.cache;var tokens=cache[template];if(tokens==null)tokens=cache[template]=parseTemplate(template,tags);return tokens};Writer.prototype.render=function(template,view,partials){var tokens=this.parse(template);var context=view instanceof Context?view:new Context(view);return this.renderTokens(tokens,context,partials,template)};Writer.prototype.renderTokens=function(tokens,context,partials,originalTemplate){var buffer="";var token,symbol,value;for(var i=0,numTokens=tokens.length;i<numTokens;++i){value=undefined;token=tokens[i];symbol=token[0];if(symbol==="#")value=this._renderSection(token,context,partials,originalTemplate);else if(symbol==="^")value=this._renderInverted(token,context,partials,originalTemplate);else if(symbol===">")value=this._renderPartial(token,context,partials,originalTemplate);else if(symbol==="&")value=this._unescapedValue(token,context);else if(symbol==="name")value=this._escapedValue(token,context);else if(symbol==="text")value=this._rawValue(token);if(value!==undefined)buffer+=value}return buffer};Writer.prototype._renderSection=function(token,context,partials,originalTemplate){var self=this;var buffer="";var value=context.lookup(token[1]);function subRender(template){return self.render(template,context,partials)}if(!value)return;if(isArray(value)){for(var j=0,valueLength=value.length;j<valueLength;++j){buffer+=this.renderTokens(token[4],context.push(value[j]),partials,originalTemplate)}}else if(typeof value==="object"||typeof value==="string"||typeof value==="number"){buffer+=this.renderTokens(token[4],context.push(value),partials,originalTemplate)}else if(isFunction(value)){if(typeof originalTemplate!=="string")throw new Error("Cannot use higher-order sections without the original template");value=value.call(context.view,originalTemplate.slice(token[3],token[5]),subRender);if(value!=null)buffer+=value}else{buffer+=this.renderTokens(token[4],context,partials,originalTemplate)}return buffer};Writer.prototype._renderInverted=function(token,context,partials,originalTemplate){var value=context.lookup(token[1]);if(!value||isArray(value)&&value.length===0)return this.renderTokens(token[4],context,partials,originalTemplate)};Writer.prototype._renderPartial=function(token,context,partials){if(!partials)return;var value=isFunction(partials)?partials(token[1]):partials[token[1]];if(value!=null)return this.renderTokens(this.parse(value),context,partials,value)};Writer.prototype._unescapedValue=function(token,context){var value=context.lookup(token[1]);if(value!=null)return value};Writer.prototype._escapedValue=function(token,context){var value=context.lookup(token[1]);if(value!=null)return mustache.escape(value)};Writer.prototype._rawValue=function(token){return token[1]};mustache.name="mustache.js";mustache.version="2.0.0";mustache.tags=["{{","}}"];var defaultWriter=new Writer;mustache.clearCache=function(){return defaultWriter.clearCache()};mustache.parse=function(template,tags){return defaultWriter.parse(template,tags)};mustache.render=function(template,view,partials){return defaultWriter.render(template,view,partials)};mustache.to_html=function(template,view,partials,send){var result=mustache.render(template,view,partials);if(isFunction(send)){send(result)}else{return result}};mustache.escape=escapeHtml;mustache.Scanner=Scanner;mustache.Context=Context;mustache.Writer=Writer});

(function ($) {
    if (window.FP) return;
    // FP 命名空间
    window.FP = FP = (function ($) {
        var debug = window.debug ? true: false;
        // 绑定只执行一次
        var onceCallbacks = $.Callbacks('once');
        // 绑定执行多次
        var normalCallbacks = $.Callbacks();

        FP = function () {
            var self = this;
            $(document).ready(function () {
                self.trigger(arguments);
            });
        };

        /**
         * 方法将会在 document.ready或者 ajax.success 之后被调用
         * @param cb
         */
        FP.prototype.attach = function (cb, flags) {
            if (flags == 'once') {
                onceCallbacks.add(cb);
            }
            else {
                normalCallbacks.add(cb);
            }
        };

        /**
         * 快速方法 - 效果等同于 fp.attach(fn, 'once')
         */
        FP.prototype.onceAttach = function (cb) {
            this.attach(cb, 'once');
        };

        /**
         * 触发绑定在 document.ready / ajax.succes 的函数
         * @param args
         */
        FP.prototype.trigger = function (args) {
            onceCallbacks.fire(args);
            normalCallbacks.fire(args);
        };
        // 接口主入口
        _fp = new FP;

        // 弹出框
        var popup = (function () {

            function Popup() {
                this.tpl = '<div class="modal fade in" id="modal-id-{{id}}">\
                                <div class="modal-dialog">\
                                    <div class="modal-content">\
                                        <div class="modal-header">{{{title}}}</div>\
                                        <div class="modal-body">{{{content}}}</div>\
                                        {{#footer}}\
                                        <div class="modal-footer">{{{footer}}}</div>\
                                        {{/footer}}\
                                    </div>\
                                </div>\
                            </div>';
                this.id = 1;
            }

            Popup.prototype.removePopup = function (id) {
                $('#modal-id-' + id).remove();
            };

            /**
             * 弹出框是一个web 元素
             * @param jQuery element object
             */
            Popup.prototype.element = function (el, options) {
                options || (options = {});
                var self = this;
                var title = options['title'] || "弹出框";
                if (jQuery.isEmptyObject(el)) throw "Popup element is empty element";
                var content = $('<div></div>').append(el.clone()).html();
                var footer = '<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>';
                var id = this.id = this.id + 1;
                var values = {
                    title: title,
                    content: content,
                    footer: footer,
                    id: id
                };
                if (el.prop('tagName') == 'FORM') {
                    values['footer'] = false;
                }

                var compiled = Mustache.render(this.tpl, values);
                $(compiled).modal('show', options)
                    .on('hidden.bs.modal', function () {
                        self.removePopup(id);
                    });
            };

            /**
             * 简单消息提示弹出框
             * @param 消息内容
             * @param 可选项
             */
            Popup.prototype.message = function (msg, options) {
                options || (options = {});
                var self = this;
                var title = options['title'] || "消息";
                var footer = '<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>';
                var id = this.id = this.id + 1;
                var values = {
                    title: title,
                    content: '<p style="text-align:center;">'+msg+'</p>',
                    footer: footer,
                    id: id
                };
                var compiled = Mustache.render(this.tpl, values);
                $(compiled).modal('show', options).on('hidden.bs.modal', function () {
                    self.removePopup(id);
                });
            };

            /**
             * 弹出远程HTML 内容
             */
            Popup.prototype.url = function (url, options) {
                options || (options = {});
                var title = options['title'] || "消息";
                var footer = '<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>';

                var content, self = this;
                if (url.substr(0, 4) == 'http') {
                    content = "<iframe src='"+url+"' border='0px' width='100%' height='100%' ></iframe>";
                    cb.apply(self);
                }
                else {
                    FP.ajax.getHtml(url, {
                        success: function (data) {
                            var begin, end;
                            if ((begin = data.search('\<\s*body')) != -1) {
                                end = data.search('\<\/body\>');
                                content = data.substr(begin, end - begin) + '</body>';
                            }
                            else {
                                content = data;
                            }
                            console.log([begin, end]);
                            cb.apply(self);
                        }
                    });
                }

                function cb(){
                    var id = this.id = this.id + 1;
                    var values = {
                        content: content,
                        title: title,
                        footer: footer,
                        id: id
                    };
                    var compiled = Mustache.render(this.tpl, values);
                    $(compiled).modal('show', options)
                        .on('hidden.bs.modal', function () {
                            self.removePopup(id);
                        });
                }
            };


            return new Popup;
        })();
        _fp.popup = popup;

        // Ajax 请求
        var ajax = (function () {

            // 把
            var request = function (url, params) {
                if (typeof url == 'string') {
                    params['url'] = url;
                }
                var success = typeof params['success'] != 'undefined'? params['success']: function () {};

                params['success'] = function () {
                    success.apply(this, arguments);
                    _fp.trigger(arguments);
                };
                $.ajax(params);
            };

            function Ajax() {
                //TODO::
            }

            /**
             * 远程获取URL 指向的URL
             * @param url
             * @param query
             * @param params
             */
            Ajax.prototype.getHtml = function (url, query, params) {
                if (typeof params == 'undefined') {
                    params = query;
                    query = {};
                }
                params['data'] = query;
                request(url, params);
            };

            Ajax.prototype.getJSON = function (url, query, params) {
                if (typeof params == 'undefined') {
                    params = query;
                    query = {};
                    params['dataType'] = 'json';
                }
                params['data'] = query;

                request(url, params);
            };

            return new Ajax;

        })(jQuery);
        _fp.ajax = ajax;

        //TODO:: 表单验证器
        var validator = (function ($) {

            function Validator() {
                this.supportedTarget = ['input', 'select', 'textarea'];
            }

            Validator.prototype.isString = function (str) {

            };

            Validator.prototype.supportTarg = function (targetName) {
              this.supportedTarget.push(targetName);
            };

            Validator.prototype.isDate = function (str) {
                return true;
            };

            Validator.prototype.isPhone = function (str) {

            };

            Validator.prototype.showError = function () {

            };

            // personal card number
            Validator.prototype.isPCno = function (str) {

            };

            Validator.prototype.isMax = function (str) {

            };

            Validator.prototype.isMin = function (str) {

            };

            Validator.prototype.init = function () {
                var self = this;
                $(this.supportedTarget.join(',')).each(function () {
                    var el = $(this);
                    if (vname = el.attr('v-name')) {
                        //TODO::
                    }
                });
            };

            var _v = new Validator;
            // 在document.ready / ajax.success 之后 执行验证器初始化
            _fp.attach(function () {
                _v.init();
            });

            return _v;
        })(jQuery);

        _fp.validator = validator;

        //主导航链接动画效果
        _fp.menuNav = function () {
            _fp.attach(function () {
                $('#header .nav-bar li a').hover(function () {
                    var index = $(this).parent().index() + 1;
                    $('.panel-nav-' + index)
                        .siblings()
                        .hide()
                        .end()
                        .show();
                });

                $('.panel-nav li').hover(function () {
                    $(this).siblings()
                        .removeClass('active')
                        .end()
                        .addClass('active');
                });

                $('.user-nav li:first-child').click(function () {
                    $(this).siblings().children('ul').toggleClass('hideme');
                });
            });
        };

        return _fp;
    })(jQuery);

    // 不需要 $(document).ready();
    // .attache() 在ajax 返回时也会调用
    FP.attach(function () {
        console.log('document ready or ajax successed');
    });

    FP.ajax.getHtml("http://api.test.wevent.cn:7002/4.2.0/User.Feed.List?user=28089",  {
        success: function (data) {
            console.log(data);
        }
    });

    FP.ajax.getJSON("http://api.test.wevent.cn:7002/4.2.0/User.Feed.List?user=28089", {
        success: function (data) {
            console.log(data);
        }
    });

    FP.validator.showError();

    FP.menuNav();

    FP.onceAttach(function () {
        $('.form-alert').on('click' ,function() {
            FP.popup.element($("form.form-horizontal:eq(0)"));
        });

        $('.message-alert').on('click', function () {
            FP.popup.message("编辑成功");
        });

        $('.url-alert').on('click', function () {
            // 直接加载百度
            // FP.popup.url('http://baidu.com', {title: '百度'});

            // 加载内部的一个HTML;
            FP.popup.url('./login.html', {title: '登陆框'});
        });
    });

})(jQuery);