// ############################################################################################
// ######################################## INTERFACES ########################################
// ############################################################################################

interface Flow {
    id: string;
    date: string;
    user: string;
    userid: string;
    title: string;
    description: string;
    ratings: string;
    downloads: string;
    lastmodified: string;
}

interface AccountData {
    error?: string;
    id: string;
    coins: string;
    username: string;
    password: string;
    email: string;
    token: string;
    flows: null | Flow[];
    priv: string;
    ip: string;
    banned: string;
    verified: string;
    daily: string;
}

interface FlowReview {
    userid: string;
    date: string;
    username: string;
    comment: string;
    isedited: '0' | '1';
}

interface ReqFlowReview extends FlowReview {
    error?: string;
    response?: string;
}


// ##########################################################################################
// ######################################## APP CORE ########################################
// ##########################################################################################

$(function () {


    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- GLOBAL FUNCTIONS ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    let _windowWidth = <number>$(window).width();
    let _windowHeight = <number>$(window).height();

    let _body = $('body');
    const _flowshareURLs = {
        homepage: 'https://rasphost.com/flowshare/web/test/home/',
        homepageDir: '/flowshare/web/test/home/',
        api: 'https://rasphost.com/flowshare/',
    };

    $(window).on('resize', () => {

        _windowWidth = <number>$(window).width();
        _windowHeight = <number>$(window).height();

        searchBarWindowResize();

        filterWindowResize();

        footerWindowResize();

    });

    // ---------- POPUP MANAGEMENT ----------

    interface popupParams {
        message: string;
        timeout?: number;
        title?: string;
        callback?: (choice: 0 | 1 | null, timeoutCancel: boolean) => void;
        buttons?: [ string, string | null ];
    }

    const _screenBlur = $('#screen-blur');

    function popup(params: popupParams) {

        const { message, title = '', timeout, callback, buttons = [ 'Ok', null ] } = params;

        _screenBlur.addClass('active');

        let popup = $('<div class="popup-window"></div>').append(
            `<div class="popup-title">${title}</div>`,
            `<div class="popup-body">${message}</div>`,
            `<div class="popup-button" data-choice="0">${buttons[0]}</div>`,
            buttons[1] ? `<div class="popup-button" data-choice="1">${buttons[1]}</div>` : '',
        );
        _body.append(popup);

        let timeoutVar: number;
        if (timeout)
            timeoutVar = setTimeout(dismissPopup, timeout, null, true);

        $('.popup-button').on('click', function () {
            dismissPopup(
                <0 | 1>parseInt(<string>$(this).attr('data-choice')),
                false,
            );
        });

        function dismissPopup(choice: 0 | 1 | null, timeoutCancel: boolean) {
            if (timeoutVar)
                clearTimeout(timeoutVar);
            popup.remove();
            _screenBlur.removeClass('active');
            if (callback)
                callback(choice, timeoutCancel);
        }

    }

    function displayError(error: string) {
        popup({
            title: 'An error occurs',
            message: error,
            timeout: 15000,
        });
    }


    /**
     * A function to escape a string to avoid code injection
     * @param text The text do escape
     * @return string The escaped text
     */
    function escapeHTML(text: string) {
        return $('<span></span>')
            .text(text)
            .html();
    }

    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- CHECKING ACCOUNT ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    let _account: AccountCookie | null = Cookies.getJSON('account'),
        _accountPopup = $('#header-account-popup'),
        _headerAccountUser = $('#header-account-user');

    if (_account && _account['token']) {

        _headerAccountUser.text('Connecting...');

        $.ajax({
            method: 'GET',
            url: `${_flowshareURLs.api}account.php`,
            data: {
                token: _account['token'],
            },
            success: (data: string) => {

                let reqData: AccountData;
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return console.error(e);
                }

                if (reqData['error']) {
                    _account = null;
                    _headerAccountUser.text('Account');
                    toggleAccountPopup(true, reqData['error'], '#ff5b5f');
                    setTimeout(toggleAccountPopup, 8000, false);

                    if (!Cookies.getJSON('account')['email']) Cookies.remove('account');
                }

                _headerAccountUser.text(reqData['username']);

            },
            error: () => {
                toggleAccountPopup(true, 'AJAX error', '#ff5b5f');
                _headerAccountUser.text('Account');
                setTimeout(toggleAccountPopup, 8000, false);
            },
        });

    } else {
        _account = null;
    }

    _accountPopup.on('click.flowshare', () => {
        toggleAccountPopup(false);
    });

    function toggleAccountPopup(state: boolean, message?: string, color?: string) {

        if (!state) {
            return _accountPopup.fadeOut();
        }

        _accountPopup
            .text(<string>message)
            .css('backgroundColor', <string>color)
            .fadeIn();

    }


    // -----------------------------------------------------------------------------------------------------
    // ---------------------------------------- SEARCH BAR RESIZING ----------------------------------------
    // -----------------------------------------------------------------------------------------------------

    let _allowSearchBarResize: boolean = _windowWidth < 750;
    const _resultContainer = $('#search-results');
    const _searchTxtElement = $('#search-txt');
    const _searchTxtInput = <HTMLInputElement>_searchTxtElement.get(0);
    const _headerDiv = $('header');


    /**
     * Function triggered when the window width changes, in order to define if the search bar can be resized when hover
     */
    function searchBarWindowResize() {
        _allowSearchBarResize = _windowWidth < 750;
    }

    const _searchBoxDiv = $('#search-box');

    _searchBoxDiv.on('mouseenter mouseleave', e => {
        if (e.type === 'mouseenter')
            searchBarResize(true);
        else
            searchBarResize(false);
    });


    let _isSearchBarExtended: boolean = false;

    /**
     * Extent or collapse the search bar in the header
     * @param showFull `true` : extend bar, `false` : collapse it
     */
    function searchBarResize(showFull: boolean) { // manage search bar on mobile (takes entire screen when focused)

        if (!_allowSearchBarResize || _isSearchBarExtended === showFull) return;    // if can't be resized (screen is too big or already extended)

        if (showFull) { // full search bar

            _headerDiv.addClass('search-expand');   // Set the expansion style to the nav-bar

            setTimeout(() => {
                _isSearchBarExtended = true;
                _searchTxtElement.trigger('focus'); // put focus on search field
                _searchTxtInput.setSelectionRange(999999, 999999); // put cursor at the end of the text
            }, 100);

        } else {    // close search bar

            _headerDiv.removeClass('search-expand');    // Reset the default style to the bar
            _searchBoxDiv.trigger('blur');    // remove the focus
            _isSearchBarExtended = false;

        }
    }


    // -------------------------------------------------------------------------------------------------
    // ---------------------------------------- SEARCH FUNCTION ----------------------------------------
    // -------------------------------------------------------------------------------------------------

    let _searchResultData: any;   // array with result flows from search

    _searchTxtElement.on('blur focusout', () => {   // remove instant search on text blur
        setTimeout(     // timeout because if it's disappear too fast the user can't click on the search results
            () => {
                searchBarResize(false);
                _resultContainer
                    .removeClass('search-padding')
                    .html('');
            },
            100,
        );

    });


    // ----- INSTANT SEARCH -----

    _searchTxtElement.on('keyup focus', function () {// trigger instant search

        let searchStr = <string>$(this).val() || '';  // text entered in the search field

        if (searchStr.match(/^ *$/))  // if field is blank
            return _resultContainer
                .removeClass('search-padding')
                .html('');

        instantSearch(searchStr);

    });


    /**
     * Display the result of the instant search below the search box
     * @param str the term to search
     */
    function instantSearch(str: string) {

        if (str.length > 31) return displayResult(null, 'Text is too long');

        $.ajax({
            method: 'GET',
            url: `${_flowshareURLs.api}search.php?instant&text=${encodeURI(str)}`,
            timeout: 2000,
            success: (data: string) => {

                let reqData: any;
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return displayResult(null, 'JSON parse error');
                }

                if (reqData.error) return displayResult(null, reqData.error);

                _searchResultData = <Flow[]>reqData;
                displayResult(<Flow[]>reqData);

            },
            error: () => {
                displayResult(null, 'AJAX error');
            },
        });

        // Format result
        function displayResult(flowsData: Flow[] | null, error?: string | undefined) {

            if (_searchTxtElement.val() !== str) return;

            _resultContainer
                .addClass('search-padding')
                .html('');

            if (error) return _resultContainer.append(
                $('<div class="result" style="cursor: default;"></div>').text(error),
            );

            $.each(flowsData, function (ind: string, val: Flow) {

                _resultContainer.append(
                    $(`<div class="result" data-flow-index="${ind}" data-flow-id="${val.id}"></div>`).text(val.title),
                );

            });

            $('.result').off('flowshare.click').on('click.flowshare', function () {

                let flowData = _searchResultData[<string>$(this).attr('data-flow-index')];
                let flowID = <string>$(this).attr('data-flow-id');

                displayFullFlowData(flowData, flowID);

            });

        }

    }

    // ----- GLOBAL SEARCH -----

    _searchBoxDiv.on('submit click', function (e) {     // starts global search
        const parentElement = <HTMLElement>e.target.parentElement;
        if (
            (e.target.id === 'search-btn' || parentElement.id === 'search-btn' || e.type !== 'click') // if the goof element or the good event is triggered
            && (_isSearchBarExtended  // if the search bar is not collapsed
            || !_allowSearchBarResize))   // if the search bar is too small so that the search bar can't be collapsed
            globalSearch(<string>_searchTxtElement.val());
    });

    function globalSearch(str: string) {

        if (str.match(/^[ ]*$/)) return;

        _searchFilters.search = str;

        let searchTags = new URLSearchParams();
        $.each(_searchFilters, (key: string, value) => {
            searchTags.append(key, <string>value);
        });
        window.location.search = searchTags.toString();

    }


    /**
     * Add the trigger so that when the back arrow is pressed, it applies the filter
     */
    function flowSearchBackArrowPress(): void {   // when back arrow pressed on search list
        $('#flow-search-back-arrow').off('click.flowshare').on('click.flowshare', () => {
            applyFilters(true);
        });
    }


    // ----------------------------------------------------------------------------------------------------
    // ---------------------------------------- ACCOUNT MANAGEMENT ----------------------------------------
    // ----------------------------------------------------------------------------------------------------

    // todo: check token


    // ----------------------------------------------------------------------------------------------
    // ---------------------------------------- LOAD FILTERS ----------------------------------------
    // ----------------------------------------------------------------------------------------------

    let _searchFilters: {
        [key: string]: string | null
    } = {
        sort: null,
        id: null,
        search: null,
    };

    let _defaultFilterValues: {
        [key: string]: {
            default?: string,
            display: boolean,
            displayType?: string,
            type: string
        }
    } = {
        sort: {
            default: 'new',
            display: true,
            displayType: 'filter',
            type: 'string',
        },
        id: {
            default: undefined,
            display: false,
            type: 'int',
        },
        search: {
            default: undefined,
            display: true,
            displayType: 'search',
            type: 'string',
        },
    };

    let _searchTags = new URLSearchParams(window.location.search);

    let _responseDiv = $('.response');

    $.each(_defaultFilterValues, (filterName: string, filterData: any) => {    // for each possible filters

        let tag = _searchTags.get(filterName) || filterData.default;  // getting actual value or set the default one
        let result;

        if (filterData.display) {    // if the value can be displayed

            result = displayFilters(filterName, tag, filterData.displayType);   // tries to display the value
            if (!result) displayFilters(filterName, filterData.default, filterData.displayType);    // if value wasn't displayed then display the default one

        } else result = true;

        if (filterData.default !== tag && result) _searchFilters[filterName] = tag;    // if not default then value put it in filters list
    });


    /**
     * Tries to display the filter if possible
     * @param name filter name
     * @param value filter value
     * @param displayType filter value type
     * @return boolean true if the filter is applied, otherwise false
     */
    function displayFilters(name: string, value: string, displayType: string): boolean {
        let result = false;

        if (displayType === 'filter') {

            _responseDiv.each(function () {
                if ($(this).attr('data-filter-value') !== value) return;  // if wrong div
                $(this).parent().children('.response').css('backgroundColor', 'transparent');   // removing color of other fibers
                $(this).css('backgroundColor', '#fdcb6e');  // setting color of selection
                result = true;
            });

        } else if (displayType === 'search') {
            _searchTxtElement.val(value);
            result = true;
        }

        return result;
    }

    _responseDiv.css('transition', '.4s');    // activating animation (disabled for fastest loading display)


    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- FILTER SELECTION ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    // ----- FILTERS STYLE -----

    let _isFilterExtended = true;
    let _allowFilterExtend = _windowWidth < 1000;

    if (_windowWidth < 1000) $('#nav-arrow').show();

    $('nav .title').on('click', () => {
        extentFilter(_isFilterExtended);
        _isFilterExtended = !_isFilterExtended;
    });


    /**
     * Function triggered when the window width changes, in order to define the position of the filter and if it can be extended
     */
    function filterWindowResize() {
        if (_windowWidth < 1000) {
            extentFilter(true);
            _allowFilterExtend = true;
            $('#nav-arrow').show();
        } else {
            extentFilter(false);
            _allowFilterExtend = false;
            $('#nav-arrow').hide();
        }
        _isFilterExtended = <number>$('nav').width() < 100;
    }


    /**
     * Extend of collapse the filter
     * @param extend `true` to extend, `false` to collapse
     */
    function extentFilter(extend: boolean): void {
        if (!_allowFilterExtend) return;
        if (extend) {
            $('nav').css('height', '60px');
            $('#nav-arrow').removeClass('active');
        } else {
            $('nav').css('height', '310px');
            $('#nav-arrow').addClass('active');
        }
        setTimeout(footerWindowResize, 400);  // manage the footer position
    }

    $('.filter').on('click', '.response', function () {
        let sel = $(this);
        sel.parent().children('.response').css('backgroundColor', 'transparent');   // removing color of other fibers
        sel.css('backgroundColor', '#fdcb6e');  // setting color of selection

        // ----- MANAGE FILTERS -----

        let filterName = <string>sel.parent().attr('data-filter-name');
        let filterValue = <string>sel.attr('data-filter-value');
        let isDefault = _defaultFilterValues[filterName].default === filterValue;

        if (isDefault)
            delete _searchFilters[filterName];
        else
            _searchFilters[filterName] = filterValue;

    });

    // ----- APPLY FILTERS -----

    $('#apply-filters').on('click', () => {
        applyFilters(true);
    });


    /**
     * Update the URL with the new filters (without the search)
     * @param reload if the page needs to be reloaded or if the URL needs to be changed dynamically
     */
    function applyFilters(reload: boolean): void {
        let searchTags = new URLSearchParams();
        delete _searchFilters.search;
        $.each(_searchFilters, (key: string, value) => {
            if (value !== null)
                searchTags.append(key, <string>value);
        });
        if (reload)
            window.location.search = searchTags.toString();
        else if (searchTags.toString() === '')
            history.pushState({}, '', './');
        else
            history.pushState({}, '', `?${searchTags.toString()}`);

    }


    // -----------------------------------------------------------------------------------------------
    // ---------------------------------------- FLOWS BROWSER ----------------------------------------
    // -----------------------------------------------------------------------------------------------

    let _flowBrowserOffset = 0;
    let _flowBrowserFlows: Flow[] = [];

    if (!_searchFilters.search)
        queryTopFlows(<string>_searchFilters.sort);
    else
        querySearchFlow(_searchFilters.search);

    let _flowsRequestData: Flow[];
    let _flowContainerList = $('#flow-list-container');


    /**
     * Query the flows and display them in the flow container list
     * @param queryMode `new` or `null` for the top new, `rated` for the top rated
     */
    function queryTopFlows(queryMode?: string) {

        let data: any = { offset: _flowBrowserOffset };

        if (queryMode === 'rated')
            data['rated'] = 1;

        $.ajax({
            type: 'GET',
            url: `${_flowshareURLs.api}flows.php`,
            data: data,
            timeout: 5000,
            success: (data: string) => {

                if (!decodeBrowserRequestData(data))
                    return;
                let reqData = <Flow[]>decodeBrowserRequestData(data);

                _flowBrowserFlows = [ ..._flowBrowserFlows, ...reqData ];
                displayFlowsList();

            },
            error: () => {
                $('#flows-loading').html('Error when getting flows list: AJAX error<br>Please reload page or contact the site administrator.');
            },
        });
    }

    function querySearchFlow(str: string) {

        $.ajax({
            type: 'GET',
            url: `${_flowshareURLs.api}search.php`,
            data: {
                text: str,
                offset: _flowBrowserOffset,
            },
            timeout: 5000,
            success: (data: string) => {

                if (!decodeBrowserRequestData(data))
                    return;
                let reqData = <Flow[]>decodeBrowserRequestData(data);

                _flowBrowserFlows = [ ..._flowBrowserFlows, ...reqData ];
                const resultCount: number = _flowBrowserFlows.length;
                displayFlowsList(`${resultCount} result${resultCount > 1 ? 's' : ''}</span> for ${str}`, true);

            },
            error: () => {
                $('#flows-loading').html('Error when getting flows list: AJAX error<br>Please reload page or contact the site administrator.');
            },
        });

    }

    function decodeBrowserRequestData(data: string): boolean | Flow[] {

        let reqData;
        try {
            reqData = JSON.parse(data);
        } catch (e) {
            $('#flows-loading').html(`JSON Parse error<br>Error: <br>${e}<br>Response body:<br>${data}`);
            return false;
        }

        if (reqData.error && _flowBrowserFlows.length === 0) {
            _flowContainerList.prepend('<i class="fas fa-chevron-circle-left back-arrow" id="flow-search-back-arrow" style="top: 5px; left: 5px"></i>');
            flowSearchBackArrowPress();
            $('#flows-loading').html(`Error: ${reqData.error}`);
            return false;
        }

        return reqData;

    }

    function displayFlowsList(header?: string, showBackButton?: boolean) {

        let data: Flow[] = _flowBrowserFlows;

        _flowsRequestData = data;

        _flowContainerList.text('');

        if (header) {

            let backButton = showBackButton ? '<i class="fas fa-chevron-circle-left back-arrow" id="flow-search-back-arrow"></i>' : '';

            _flowContainerList.append(
                $(`<div class="header">${backButton}${header}</div><hr>`),
            );

            if (showBackButton) flowSearchBackArrowPress();

        }

        $.each(data, function (index, value: any) {

            _flowContainerList.append(
                `<div class="flow-container" data-flow-id="${value['id']}" data-flow-index="${index}">
                    <div class="top-bar">
                        <div class="flow-title">${escapeHTML(value['title'])}</div>
                        <div class="flow-author">${escapeHTML(value['user'])}</div>
                    </div>
                    <div class="card-body">
                        <div class="flow-description">${escapeHTML(value['description'])}</div>
                        <div class="flow-stats">
                            <div>
                                <i class="fas fa-download"></i>
                                <span class="number-container">${value['downloads']}</span>
                            </div>
                            <div>
                                <i class="far fa-star"></i>
                                <span class="number-container">${value['ratings']}</span>
                            </div>
                        </div>
                    </div>
                </div>`,
            );

            $('.flow-container:odd').css('backgroundColor', '#E5E5E5');

        });

        triggerFlowContainerClick();    // starting click trigger
        footerWindowResize();   // change the footer position

    }


    // ----- Scroll updates -----

    let _scrollingUpdate = false;

    _body.on('scroll', () => {

        let remainScroll = _body.prop('scrollHeight') - <number>_body.height() - <number>_body.scrollTop();

        if (remainScroll < 200 && !_scrollingUpdate) {

            _flowBrowserOffset = 15;

            if (!_searchFilters.search)
                queryTopFlows(<string>_searchFilters.sort);
            else
                querySearchFlow(<string>_searchFilters.search);

            _scrollingUpdate = true;

        }

    });


    // --------------------------------------------------------------------------------------------------------
    // ---------------------------------------- DISPLAY FULL FLOW DATA ----------------------------------------
    // --------------------------------------------------------------------------------------------------------


    /**
     * Set the trigger so when a flow is selected in the flow list, its full data is displayed in the foreground
     */
    function triggerFlowContainerClick() {

        $('.flow-container').off('click.flowshare').on('click.flowshare', function () {

            let flowIndex = parseInt(<string>$(this).attr('data-flow-index'));
            let flowID = <string>$(this).attr('data-flow-id');
            let flowData = _flowsRequestData[flowIndex];

            displayFullFlowData(flowData, flowID);

        });

    }


    /**
     * Display the full flows data in the foreground
     * @param flowData the flow data
     * @param flowID the flow ID on flowshare
     */
    function displayFullFlowData(flowData: Flow, flowID: string) {

        $('#flow-data')
            .html(
                `
                <i class="fas fa-chevron-circle-left back-arrow" id="full-flow-data-back-arrow"></i>
                <div class="flow-title">${escapeHTML(flowData['title'])}</div>
                <div class="flow-author">${escapeHTML(flowData['user'])}</div>
                <div id="flow-stats-bar">
                    <div>
                        <i class="fas fa-download"></i>
                        <span class="number-container">${flowData['downloads']}</span>
                    </div>
                    <div>
                        <i class="far fa-star"></i>
                        <span class="number-container">${flowData['ratings']}</span>
                    </div>
                </div>
                <div class="flow-description">${escapeHTML(flowData['description'])}</div>
                <div id="flow-buttons-bar">
                    <div id="download-button"><i class="fas fa-file-download" style="margin-right: 5px"></i>Download</div>
                    <div id="review-button" style="float: none"><i class="fas fa-user-plus" style="margin-right: 5px"></i>Add review</div>
                </div>
                <form id="review-add-form" onsubmit="return false">
                    <div class="blur"></div>
                    <div id="rating-add-title">Add a review</div>
                    <textarea></textarea>
                    <input id="review-add-submit" type="button" value="Post comment">
                    <input id="review-add-cancel" type="reset" value="Cancel">
                </form>
                `,
            )
            .css('opacity', 1)
            .css('pointerEvents', 'all');


        // manage download button

        $('#download-button').off('click.flowshare').on('click.flowshare', () => {
            downloadFlow(flowID, flowData['title']);
        });

        manageAddFlowReview(flowID);  // Manage review adding

        // manage flow list

        _flowContainerList.css('opacity', 0);
        $('nav').css('opacity', 0);
        _body.css('pointerEvents', 'none');
        _headerDiv.css('pointerEvents', 'all');

        flowBackArrowClick();

        // query flow ratings

        getFlowReviews(flowID);

        // update url

        _searchFilters['id'] = <string>flowID;
        applyFilters(false);

    }

    function getFlowReviews(flowID: string | number) {

        $.ajax({
            url: `${_flowshareURLs.api}reviews.php?view&id=${flowID}`,
            method: 'GET',
            timeout: 4000,
            success: (data: string) => {

                let reqData: FlowReview[];
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return displayFlowReviews(null, data);
                }

                displayFlowReviews(reqData);

            },
            error: (response) => {
                if (response.status === 404) return;    // if no ratings
                $('#flow-data').append(
                    $(`<div class="rating-container">Error when getting flow reviews : <br>AJAX error code ${response.status}</div>`),
                );
            },

        });

    }

    let _flowUserReview: string = '';

    /**
     * Query the user's review of a flow and display it the the flow review add textarea
     * @param flowID the ID of the flow to display review
     * @param review The review to put if it's known
     */
    function displayUserFlowReview(flowID: string | number, review?: string) {

        if (_account && !review) {

            $.ajax({
                url: `${_flowshareURLs.api}reviews.php`,
                method: 'GET',
                data: {
                    me: true,
                    id: flowID,
                    token: _account.token,
                },
                success: (data: string) => {

                    let reqData: ReqFlowReview;
                    try {
                        reqData = JSON.parse(data);
                    } catch (e) {
                        return;
                    }

                    if (reqData.response && reqData.response === '1')
                        updateTextarea(reqData.comment);

                },
            });

        } else if (review) {
            updateTextarea(review);
        }

        function updateTextarea(data: string) {
            $('#review-add-form textarea').text(data);
            _flowUserReview = data;
        }
    }

    /**
     * Manage all the actions related to the user review adding
     * (show/hide panel, send the review)
     * @param flowID The ID of the flow on the community
     */
    function manageAddFlowReview(flowID: string | number) {

        displayUserFlowReview(flowID);

        const reviewForm = $('#review-add-form');

        // manage review button and area
        $('#review-button').on('click', function () {
            if (!_account)
                return popup({
                    title: 'Account required',
                    message: 'You need to be logged in to your flowshare account to post a comment',
                });

            $('#review-add-form, #review-button').addClass('enabled');

            const flowDataDiv = $('#flow-data');

            // Scroll to the textarea
            flowDataDiv.animate({
                scrollTop: $('#rating-add-title').position().top + flowDataDiv.get(0).scrollTop - 10,
            }, 400);

        });

        $('#review-add-cancel').on('click', function () {
            $('#review-add-form, #review-button').removeClass('enabled');
        });

        // manage review adding
        $('#review-add-submit').on('click', function () {
            const reviewContent = <string>$('#review-add-form textarea').val();
            if (reviewContent.length === 0 || reviewContent === _flowUserReview) return;
            reviewForm.addClass('query');
            sendFlowReview(flowID, reviewContent);
        });
    }

    /**
     * Send a flow review to the server
     * @param flowID {string | number} The ID of the flow to review
     * @param review {string} The text of the review
     */
    function sendFlowReview(flowID: string | number, review: string) {

        const reviewForm = $('#review-add-form');

        $.ajax({
            type: 'POST',
            url: `${_flowshareURLs.api}reviews.php`,
            data: {
                add: '',
                id: flowID,
                comment: review,
                token: (<AccountCookie>_account).token,
            },
            timeout: 5000,
            success: (data: string) => {

                $('#review-add-cancel').trigger('click');   // Collapse rating area

                let requestData: { response: string, error: string };
                try {
                    requestData = JSON.parse(data);
                } catch (e) {
                    return displayError(`JSON Parse error: ${e}<br>Request result: ${data}`);
                }

                getFlowReviews(flowID);

                reviewForm.removeClass('query');

                if (requestData.error)
                    displayError(requestData.error);
                else {
                    displayUserFlowReview(flowID, review);
                    popup({
                        title: 'Response',
                        message: requestData.response,
                    });
                }

            },
            error: () => {
                $('#review-add-cancel').trigger('click');   // Collapse rating area
                reviewForm.removeClass('query');
                displayError('Error when getting flows list: AJAX error<br>Please reload page or contact the site administrator.');
            },
        });

    }


    /**
     * Set the trigger so when the back arrow is pressed on full flow data display, it goes back on the flow list
     */
    function flowBackArrowClick() {
        $('#full-flow-data-back-arrow')
            .off('click.flowshare')
            .on('click.flowshare', () => {
                triggerFlowContainerClick();
                $('#flow-list-container, nav')
                    .css('opacity', 1);
                _body
                    .css('pointerEvents', 'all');
                $('#flow-data')
                    .css('opacity', 0)
                    .css('pointerEvents', 'none')
                    .html('');
                delete _searchFilters.id;
                applyFilters(false);
            });

    }


    /**
     * Display the reviews of a flow at the bottom of the full flow data
     * @param data the ratings data, `null` if an error
     * @param error the error message to display (if there is one)
     */
    function displayFlowReviews(data: FlowReview[] | null, error?: string) {

        if (data === null) return;

        let flowData = $('#flow-data');
        $('.rating-container, #rating-area-title').remove(); // remove all the previous ratings

        if (error)
            flowData.append(
                $(`<div class="rating-container">JSON Parsing error<br>Response body:<br>${error}</div>`),
            );

        if (_body.css('pointerEvents') === 'none' && data.length > 0) {

            flowData.append(
                $('<div id="rating-area-title" >Ratings</div>'),
            );

            $.each(data, function (index, value) {

                flowData.append(
                    $('<div class="rating-container"></div>')
                        .append(
                            $('<div class="rating-title"></div>')
                                .text(value['username'])
                                .append(
                                    (value['isedited'] === '1' ? ' <span style="opacity: .5; font-weight: lighter; margin-left: 10px">(edited)</span>' : ''),
                                ),
                        )
                        .append(
                            $('<div class="rating-body"></div>')
                                .text(value['comment']),
                        ),
                );

            });

            $('.rating-container:even').css('backgroundColor', '#E5E5E5');

        }

    }


    /**
     * Starts the download of a flow
     * @param id flow id
     * @param title name of the file
     */
    function downloadFlow(id: string | number, title: string) {
        $.ajax({
            method: 'GET',
            url: `${_flowshareURLs.api}flows.php/id/${id}?data&base64`,
            timeout: 10000,
            success: (data: string) => {
                let element = document.createElement('a');
                element.setAttribute('href',
                    `data:application/octet-stream;charset=utf-8;base64,${data}`,
                );
                element.setAttribute('download',
                    `${title}.flo`,
                );

                element.style.display = 'none';
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            },
            error: (e) => {
                displayError(`Download error : ${e}`);
            },
        });
    }


    // -----------------------------------------------------------------------------------------------
    // ---------------------------------------- MANAGE FOOTER ----------------------------------------
    // -----------------------------------------------------------------------------------------------

    footerWindowResize();

    /**
     * Changes the footer position (absolute or relative) depending on the windows height and the lowest container
     */
    function footerWindowResize() {

        const footerDiv = $('footer'), filterDiv = $('nav');
        // determine the lowest container
        const filterBottom: number = filterDiv.position().top + (filterDiv.height() || 200) + 100;
        const flowContainerBottom: number = _flowContainerList.position().top + (_flowContainerList.height() || 0) + 100;
        const bottomContainer: number = Math.max(filterBottom, flowContainerBottom);

        // set the footer position
        if (bottomContainer < _windowHeight - 85)
            footerDiv.css({
                position: 'absolute',
            });
        else
            footerDiv.css({
                position: 'relative',
            });

    }

});
