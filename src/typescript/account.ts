// ############################################################################################
// ######################################## INTERFACES ########################################
// ############################################################################################

interface AccountCookie {
    token: string;
    username: string;
    expires: number;
    email: string;
}

interface LoginRequest {
    error?: string;
    response: string
    token: string;
}

interface FlowUploadResult {
    error?: string;
    response: string;
    id: string;
}

// ##########################################################################################
// ######################################## APP CORE ########################################
// ##########################################################################################

$(function () {

    // ----------------------------------------------------------------------------------------
    // ---------------------------------------- GLOBAL ----------------------------------------
    // ----------------------------------------------------------------------------------------

    let _windowWidth = <number>$(window).width();

    $(window).on('resize', function () {

        _windowWidth = <number>$(this).width();

        categoryWindowResize();

    });

    const _flowshareURLs = {
        homepage: 'https://rasphost.com/flowshare/web/test/home/',
        homepageDir: '/flowshare/web/test/home/',
        api: 'https://rasphost.com/flowshare/',
    };

    // ----- TEMPLATE MANAGER -----

    const _templates = {
        daily: {
            element: $('#content-daily-template'),
            id: 'content-daily',
        },
        login: {
            element: $('#content-login-template'),
            id: 'content-login',
        },
        loginToken: {
            element: $('#content-login-token-template'),
            id: 'content-login-token',
        },
        register: {
            element: $('#content-register-template'),
            id: 'content-register',
        },
        account: {
            element: $('#content-account-template'),
            id: 'content-account',
        },
        upload: {
            element: $('#content-upload-template'),
            id: 'content-upload',
        },
    };

    /**
     * Append a container from templates to a div
     * @param templateName The template name
     * @param previousDiv The div to append the container
     */
    function setTemplate(
        templateName: 'daily' | 'login' | 'loginToken' | 'register' | 'account' | 'upload',
        previousDiv: JQuery,
    ): JQuery {
        const { element, id } = _templates[templateName];
        return element
            .clone()
            .attr('id', id)
            .appendTo(previousDiv)
            .show();
    }


    // --------------------------------------------------------------------------------------------
    // ---------------------------------------- CATEGORIES ----------------------------------------
    // --------------------------------------------------------------------------------------------

    let _allowChoseCategory: boolean = true;
    let _selectedCategory = 'account';

    const _contentDiv = $('#content');
    const _categoryDiv = $('.category');
    const _navDiv = $('nav');

    $('.category:first').addClass('selected');

    _categoryDiv.on('click.flowshare', function () {

        if (_allowChoseCategory) {

            $('.category').removeClass('selected');
            $(this).addClass('selected');

            let category = $(this).attr('data-nav-value');
            if (category === 'account' || category === 'upload' || category === 'daily')
                setCategory(category);
            else
                console.error(`Category "${category}" is undefined`);

        }

    });


    /**
     * Displays the selected category in the content window
     * @param template name of the template to display
     */
    function setCategory(template: 'account' | 'upload' | 'daily') {

        if (template === _selectedCategory)
            return;
        else
            _selectedCategory = template;

        _contentDiv.html('');

        if (template === 'account')
            displayAccountData();

        if (template === 'upload')
            displayUploadFlowForm();

        if (template === 'daily')
            displayDailyShareCoins();

    }

    setTimeout(() => {
        _categoryDiv.addClass('transition');
    }, 400);


    // ----- CATEGORY STYLE -----

    let _isNavExtended = true;
    let _allowNavExtend = _windowWidth < 1000;

    if (_windowWidth < 1000) $('#nav-arrow').show();

    $('nav .title').on('click', function () {
        extentNav(_isNavExtended);
        _isNavExtended = !_isNavExtended;
    });

    function categoryWindowResize() {
        if (_windowWidth < 1000) {
            extentNav(true);
            _allowNavExtend = true;
            $('#nav-arrow').show();
        } else {
            extentNav(false);
            _allowNavExtend = false;
            $('#nav-arrow').hide();
        }
        _isNavExtended = <number>_navDiv.height() < 100;
    }

    function extentNav(extend?: boolean) {
        if (!_allowNavExtend) return;
        if (extend) {
            _navDiv.removeClass('expanded');
            $('#nav-arrow').removeClass('active');
        } else {
            _navDiv.addClass('expanded');
            $('#nav-arrow').addClass('active');
        }
    }


    // ----------------------------------------------------------------------------------------------
    // ---------------------------------------- ACCOUNT PART ----------------------------------------
    // ----------------------------------------------------------------------------------------------

    if (!Cookies.get('account'))
        displayLoginForm();
    else {
        console.log('Starting account data');
        displayAccountData();
    }

    // ----- ACCOUNT DATA -----


    /**
     * Makes the query if there is no data and displays the content in the `#content-account` div
     * If data is supplied, just displays it in the content
     * @param data Specify the data to display. If not, the data will be queried
     */
    function displayAccountData(data?: AccountData) {

        _contentDiv.html('<div id="loading-message">Loading data...</div>');

        _navDiv.removeClass('unavailable');
        _allowChoseCategory = true;

        if (data) return displayContent(data);

        let account: AccountCookie = Cookies.getJSON('account');

        $.ajax({
            method: 'GET',
            url: `${_flowshareURLs.api}account.php`,
            data: { token: account['token'] },
            success: (data: string) => {

                let reqData: AccountData;
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return $('#loading-message').html(`AJAX error: ${e}<br>Response body: ${data}`);
                }

                if (reqData['error']) return displayLoginForm(reqData['error']);

                displayContent(reqData);

            },
            error: () => {
                $('#loading-message').text('AJAX error. Please reload the page.');
            },
        });

        function displayContent(data: AccountData) {

            _contentDiv.html('');

            let account: AccountCookie = Cookies.getJSON('account');
            let cookieExpires = account.expires === 0 ? undefined : { expires: account.expires };
            let newCookie: AccountCookie = { ...account, email: data['email'], username: data['username'] };
            Cookies.set('account', newCookie, cookieExpires);

            setTemplate('account', _contentDiv);

            $(`#content-account .title:first`).html(`Connected as ${data['username']}<br>${data['coins']} sharecoins`);

            $(`#account-logout`).on('click.flowshare', function () {
                Cookies.remove('account');
                displayLoginForm(null, data['email']);
            });

        }

    }

    // ----- LOGIN -----

    /**
     * Display the login form
     * @param error displays the error if there is one
     * @param email pre-fill the email if we know it
     */
    function displayLoginForm(error?: string | null, email?: string) {

        _contentDiv.html('');

        _navDiv.addClass('unavailable');

        _allowChoseCategory = false;
        const newElement = setTemplate('login', _contentDiv);
        const loginMail = $('#login-mail');
        const mask = $(`#content-login .mask`);
        loginMail.trigger('focus');

        if (error) displayError(error);

        if (!email && Cookies.getJSON('account'))
            email = Cookies.getJSON('account')['email'];

        if (email) {
            loginMail.val(email);
            $('#login-password').trigger('focus');
        } else {
            loginMail.trigger('focus');
        }

        newElement.on('submit', function () {

            mask.fadeIn();

            $.ajax({
                method: 'POST',
                url: `${_flowshareURLs.api}login.php`,
                data: {
                    email: loginMail.val(),
                    password: $('#login-password').val(),
                },
                success: (data: string) => {
                    loginResult(data);
                },
                error: (e) => {
                    mask.fadeOut();
                    displayError(`AJAX error: response status ${e.status}. Please try later or contact the administrator`);
                },
            });

        });

        $('#content-login .additional-button').on('click.flowshare', function () {

            if ($(this).attr('data-ref') === 'token')
                displayTokenLoginForm();
            else
                displayRegisterForm();

        });

        function loginResult(data: string) {

            mask.fadeOut();

            let reqData: LoginRequest;
            try {
                reqData = JSON.parse(data);
            } catch (e) {
                return displayError(`Error: ${e}, response body: ${data}`);
            }

            if (reqData['error']) return displayError(reqData['error']);

            if (reqData['response'] !== 'OK') return displayError(`An error occurs, response body: ${JSON.stringify(data)}`);

            let args: { expires: number } | undefined;
            if ($('#content-login #login-remember:checked').length) // if the user checked the "remember me" option
                args = { expires: 365 };

            Cookies.set('account', {
                token: reqData['token'],
                expires: args ? 365 : 0,
            }, args);

            displayAccountData();

        }

        //TODO: fix template system triggers

        function displayError(msg: string) {
            $('.error-msg:first').text(msg);
            loginMail.trigger('focus');
            return $('#login-password').val('');
        }


    }


    // ----- LOGIN WITH TOKEN -----

    /**
     * Displays the login form in the `#content` div and makes the ajax request when submitted
     */
    function displayTokenLoginForm() {

        _contentDiv.html('');

        _navDiv.addClass('unavailable');

        _allowChoseCategory = false;

        const contentLoginToken = setTemplate('loginToken', _contentDiv);
        const loginToken = $('#login-token');

        loginToken.trigger('focus');
        let mask = $('#content-login-token .mask');

        contentLoginToken.on('submit', function () {

            mask.fadeIn();

            $.ajax({
                method: 'GET',
                url: `${_flowshareURLs.api}account.php`,
                data: {
                    token: loginToken.val(),
                },
                timeout: 5000,
                success: (data: string) => {
                    mask.fadeOut();
                    ajaxResult(data);
                },
                error: (e) => {
                    mask.fadeOut();
                    displayError(`AJAX error : response code ${e.status}. Please try later or contact the administrator`);
                },
            });

        });

        $('#content-login-token .additional-button').on('click.flowshare', function () {
            displayLoginForm();
        });

        function ajaxResult(data: string) {

            let reqData: AccountData;
            try {
                reqData = JSON.parse(data);
            } catch (e) {
                return displayError(`Error: ${e}. Response body: ${data}`);
            }

            if (reqData['error'])
                return displayError(reqData['error']);

            if (!(reqData['username']))
                return displayError('Unknown error, please try again');

            let args: { expires: number } | undefined;
            if ($('#content-login-token #token-remember:checked').length > 0)
                args = { expires: 365 };

            console.log(args);

            Cookies.set('account', {
                token: loginToken.val(),
                username: reqData['username'],
                expires: args ? 365 : 0,
            }, args);

            displayAccountData(reqData);

        }

        function displayError(msg: string) {
            $('.error-msg:first').text(msg);
            loginToken.trigger('focus');
        }

    }

    // ----- REGISTER -----

    const _registerEmail = $('#register-email');

    function displayRegisterForm() {

        _contentDiv.html('');

        _navDiv.addClass('unavailable');

        _allowChoseCategory = false;
        const contentRegister = setTemplate('register', _contentDiv);

        _registerEmail.trigger('focus');
        // let mask = $('#content-register .mask');

        //todo: finish register part
        alert('This functionality is WIP. Please create an account with the flowshare flow.');

        contentRegister.on('submit', function () {

            let requestData = {
                email: _registerEmail.val(),
                password: $('#register-password-1').val(),
                username: $('#register-username').val(),
            };

            if (requestData.password !== $('#register-password-2').val())   // if password != password confirmation
                return displayError('The two passwords must be identical.');

            //     mask.fadeIn();
            //
            //     $.ajax({
            //         method: 'POST',
            //         url: `${flowshareURLs.api}register.php`,
            //         data: requestData,
            //         timeout: 5000,
            //         success: function (data) {
            //             mask.fadeOut();
            //         },
            //         error: function () {
            //             mask.fadeOut();
            //         }
            //     })

        });

        $('#content-register .additional-button').on('click.flowshare', function () {
            displayLoginForm();
        });

        function displayError(msg: string) {
            $('.error-msg:first').text(msg);
            $('#register-password-1, #register-password-2').val('');
            _registerEmail.trigger('focus');
        }

    }


    // ---------------------------------------------------------------------------------------------
    // ---------------------------------------- UPLOAD FLOW ----------------------------------------
    // ---------------------------------------------------------------------------------------------

    /**
     * Displays the form for flow uploading in the `#content` div, and uploads the flow when submitted
     */
    function displayUploadFlowForm() {

        setTemplate('upload', _contentDiv);

        let flowData: string,
            uploadTitle = $('#upload-title'),
            uploadDescription = $('#upload-description'),
            uploadFlowInput = $('#upload-flow'),
            mask = $('#content-upload .mask'),
            errorMsg = $('#content-upload .error-msg');

        uploadFlowInput.on('change', function () {

            let fr = new FileReader();
            let file = uploadFlowInput.prop('files')[0];
            fr.onload = function () {
                // @ts-ignore
                flowData = fr.result.split(';base64,')[1];
                if (uploadTitle.val() === '')
                    uploadTitle.val(file.name.split('.flo')[0]);
            };
            fr.readAsDataURL(file);

        });

        $('#content-upload').on('submit', function () {
            uploadFlow(
                <string>uploadTitle.val(),
                <string>uploadDescription.val(),
                flowData,
            );
        });

        function uploadFlow(title: string, description: string, data: string) {

            let token = Cookies.getJSON('account').token;
            mask.fadeIn();

            $.ajax({
                method: 'POST',
                url: `${_flowshareURLs.api}flows.php`,
                data: {
                    title: title,
                    description: description,
                    data: data,
                    base64: '',
                    token: token,
                    post: '',
                },
                timeout: 10000,
                success: (data: string) => {

                    mask.fadeOut();

                    let reqData: FlowUploadResult;
                    try {
                        reqData = JSON.parse(data);
                    } catch (e) {
                        return errorMsg.text(`JSON parse error, response: ${data}`);
                    }

                    loadResponse(reqData);

                },
                error: (e) => {
                    mask.fadeOut();
                    errorMsg.text(`AJAX error, response code ${e.status}, please try again.`);
                },
            });

            function loadResponse(data: FlowUploadResult) {

                if (data.error) return errorMsg.text(data.error);

                _contentDiv.html(
                    `<div id="loading-message">Response: ${data.response}${data.id ? `, flow id: ${data.id}` : ''}</div>`,
                );

            }

        }

    }


    // ------------------------------------------------------------------------------------------------------
    // ---------------------------------------- GET DAILY SHARECOINS ----------------------------------------
    // ------------------------------------------------------------------------------------------------------


    /**
     * Displays the button to get the sharecoins in the `#content` div, and makes the queries when the button is pressed
     */
    function displayDailyShareCoins() {

        setTemplate('daily', _contentDiv);

        const dailyButton = $('#daily-button');
        const mask = $('#content-daily .mask');
        const errorMsg = $('#content-daily .error-msg')
            .css('padding-top', '10px');

        dailyButton.on('click', function () {

            let token = Cookies.getJSON('account').token;
            mask.fadeIn();

            $.ajax({
                method: 'POST',
                url: `${_flowshareURLs.api}daily.php`,
                data: {
                    token: token,
                },
                timeout: 5000,
                success: function (data) {

                    mask.fadeOut();

                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        return errorMsg.text(`JSON parse error, response: ${data}`);
                    }

                    if (data['error'])
                        return errorMsg
                            .css('color', 'red')
                            .text(data.error);

                    errorMsg
                        .css('color', '#3bce38')
                        .text(data.response);

                },
                error: function (e) {
                    mask.fadeOut();
                    errorMsg.text(`AJAX error, response code ${e.status}. Please try later`);
                },
            });

        });

    }

});
