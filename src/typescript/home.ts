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


// ##########################################################################################
// ######################################## APP CORE ########################################
// ##########################################################################################

$(function () {


    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- GLOBAL FUNCTIONS ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    let windowWidth = <number>$(window).width();
    let windowHeight = <number>$(window).height();

    let body = $('body');
    const flowshareURLs = {
        homepage: 'https://rasphost.com/flowshare/web/test/home/',
        homepageDir: '/flowshare/web/test/home/',
        api: 'https://rasphost.com/flowshare/',
    };

    $(window).on('resize', () => {

        windowWidth = <number>$(window).width();
        windowHeight = <number>$(window).height();

        searchBarWindowResize();

        filterWindowResize();

        flowDataWindowResize();

        footerWindowResize();

    });


    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- CHECKING ACCOUNT ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    let account: AccountCookie = Cookies.getJSON('account'),
        accountPopup = $('#header-account-popup'),
        headerAccountUser = $('#header-account-user');

    if (account && account['token']) {

        headerAccountUser.text('Connecting...');

        $.ajax({
            method: 'GET',
            url: `${flowshareURLs.api}account.php`,
            data: {
                token: account['token'],
            },
            success: (data: string) => {

                let reqData: AccountData;
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return console.error(e);
                }

                if (reqData['error']) {
                    headerAccountUser.text('Account');
                    toggleAccountPopup(true, reqData['error'], '#ff5b5f');
                    setTimeout(toggleAccountPopup, 8000, false);

                    if (!Cookies.getJSON('account')['email']) Cookies.remove('account');
                }

                headerAccountUser.text(reqData['username']);

            },
            error: () => {
                toggleAccountPopup(true, 'AJAX error', '#ff5b5f');
                headerAccountUser.text('Account');
                setTimeout(toggleAccountPopup, 8000, false);
            },
        });

    }

    accountPopup.on('click.flowshare', () => {
        toggleAccountPopup(false);
    });

    function toggleAccountPopup(state: boolean, message?: string, color?: string) {

        if (!state) {
            return accountPopup.fadeOut();
        }

        accountPopup
            .text(<string>message)
            .css('backgroundColor', <string>color)
            .fadeIn();

    }


    // -----------------------------------------------------------------------------------------------------
    // ---------------------------------------- SEARCH BAR RESIZING ----------------------------------------
    // -----------------------------------------------------------------------------------------------------

    let allowSearchBarResize: boolean = windowWidth < 750;
    const resultContainer = $('#search-results');
    const searchTxtInput = $('#search-txt');


    /**
     * Function triggered when the window width changes, in order to define if the search bar can be resized when hover
     */
    function searchBarWindowResize() {
        allowSearchBarResize = windowWidth < 750;
    }

    const searchBoxDiv = $('#search-box');

    searchBoxDiv.on('mouseenter mouseleave', e => {
        if (e.type === 'mouseenter')
            searchBarResize(true);
        else
            searchBarResize(false);
    });


    let isSearchBarExtended: boolean = false;

    /**
     * Extent or collapse the search bar in the header
     * @param showFull `true` : extend bar, `false` : collapse it
     */
    function searchBarResize(showFull: boolean) { // manage search bar on mobile (takes entire screen when focused)

        if (!allowSearchBarResize || isSearchBarExtended === showFull) return;    // if can't be resized (screen is too big or already extended)

        if (showFull) { // full search bar

            $('#logo-big, #header-account').fadeOut(200);   // makes logo and account disappear
            searchBoxDiv.css({  // expand global div
                width: '280px',
                right: 'calc((100% - 280px) / 2)',
            });
            searchTxtInput.css('width', '230px'); // expand search field
            resultContainer.show(); // shows results

            setTimeout(() => {
                isSearchBarExtended = true;
                const searchTxt = <HTMLInputElement>$('#search-txt')
                    .trigger('focus') // put focus on search field
                    .get(0);
                searchTxt.setSelectionRange(999999, 999999); // put cursor at the end of the text
            }, 100);

        } else {    // close search bar

            $('#logo-big, #header-account').fadeIn(200);    // makes logo and account appear
            searchBoxDiv
                .css({  // collapse global div
                    width: 'auto',
                    right: '120px',
                })
                .trigger('blur');    // remove the focus
            searchTxtInput.css('width', '0');     // collapse search field
            resultContainer.hide(); // hide results
            isSearchBarExtended = false;

        }
    }


    // -------------------------------------------------------------------------------------------------
    // ---------------------------------------- SEARCH FUNCTION ----------------------------------------
    // -------------------------------------------------------------------------------------------------

    let searchResultData: any;   // array with result flows from search

    searchTxtInput.on('blur', () => {   // remove instant search on text blur
        setTimeout(     // timeout because if it's disappear too fast the user can't click on the search results
            () => {
                searchBarResize(false);
                resultContainer
                    .css('padding', '0')
                    .html('');
            },
            100,
        );

    });


    // ----- INSTANT SEARCH -----

    searchTxtInput.on('keyup focus', function () {// trigger instant search

        let searchStr = <string>$(this).val() || '';  // text entered in the search field

        if (searchStr.match(/^ *$/))  // if field is blank
            return resultContainer
                .css('padding', '0')
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
            url: `${flowshareURLs.api}search.php?instant&text=${encodeURI(str)}`,
            timeout: 2000,
            success: (data: string) => {

                let reqData: any;
                try {
                    reqData = JSON.parse(data);
                } catch (e) {
                    return displayResult(null, 'JSON parse error');
                }

                if (reqData.error) return displayResult(null, reqData.error);

                searchResultData = <Flow[]>reqData;
                displayResult(<Flow[]>reqData);

            },
            error: () => {
                displayResult(null, 'AJAX error');
            },
        });

        // Format result
        function displayResult(flowsData: Flow[] | null, error?: string | undefined) {

            if ($('#search-txt').val() !== str) return;

            resultContainer
                .css('padding', '8px')
                .html('');

            if (error) return resultContainer.append(
                $('<div class="result" style="cursor: default;"></div>').text(error),
            );

            $.each(flowsData, function (ind: string, val: Flow) {

                resultContainer.append(
                    $(`<div class="result" data-flow-index="${ind}" data-flow-id="${val.id}"></div>`).text(val.title),
                );

            });

            $('.result').off('flowshare.click').on('click.flowshare', function () {

                let flowData = searchResultData[<string>$(this).attr('data-flow-index')];
                let flowID = <string>$(this).attr('data-flow-id');

                displayFullFlowData(flowData, flowID);

            });

        }

    }

    // ----- GLOBAL SEARCH -----

    searchBoxDiv.on('submit click', function (e) {     // starts global search
        const parentElement = <HTMLElement>e.target.parentElement;
        if (
            (e.target.id === 'search-btn' || parentElement.id === 'search-btn' || e.type !== 'click') // if the goof element or the good event is triggered
            && (isSearchBarExtended  // if the search bar is not collapsed
            || !allowSearchBarResize))   // if the search bar is too small so that the search bar can't be collapsed
            globalSearch(<string>$('#search-txt').val());
    });

    function globalSearch(str: string) {

        if (str.match(/^[ ]*$/)) return;

        searchFilters.search = str;

        let searchTags = new URLSearchParams();
        $.each(searchFilters, (key: string, value) => {
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

    $('#header-account').on('click.flowshare', () => {

        // redirect on account page
        let loc = window.location.href;

        if (loc.match(/\/home\/.*/))
            window.location.href = `${loc.replace(/home\/.*/, '')}account/`;
        else
            window.location.href = `${loc.split('/').slice(0, -1).join('/')}/account/`;

    });


    // ----------------------------------------------------------------------------------------------
    // ---------------------------------------- LOAD FILTERS ----------------------------------------
    // ----------------------------------------------------------------------------------------------

    let searchFilters: {
        [key: string]: string | null
    } = {
        sort: null,
        id: null,
        search: null,
    };

    let defaultFilterValues: {
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

    let searchTags = new URLSearchParams(window.location.search);

    let responseDiv = $('.response');

    $.each(defaultFilterValues, (filterName: string, filterData: any) => {    // for each possible filters

        let tag = searchTags.get(filterName) || filterData.default;  // getting actual value or set the default one
        let result;

        if (filterData.display) {    // if the value can be displayed

            result = displayFilters(filterName, tag, filterData.displayType);   // tries to display the value
            if (!result) displayFilters(filterName, filterData.default, filterData.displayType);    // if value wasn't displayed then display the default one

        } else result = true;

        if (filterData.default !== tag && result) searchFilters[filterName] = tag;    // if not default then value put it in filters list
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

            responseDiv.each(function () {
                if ($(this).attr('data-filter-value') !== value) return;  // if wrong div
                $(this).parent().children('.response').css('backgroundColor', 'transparent');   // removing color of other fibers
                $(this).css('backgroundColor', '#fdcb6e');  // setting color of selection
                result = true;
            });

        } else if (displayType === 'search') {
            searchTxtInput.val(value);
            result = true;
        }

        return result;
    }

    responseDiv.css('transition', '.4s');    // activating animation (disabled for fastest loading display)


    // --------------------------------------------------------------------------------------------------
    // ---------------------------------------- FILTER SELECTION ----------------------------------------
    // --------------------------------------------------------------------------------------------------

    // ----- FILTERS STYLE -----

    let isFilterExtended = true;
    let allowFilterExtend = windowWidth < 1000;

    if (windowWidth < 1000) $('#nav-arrow').show();

    $('nav .title').on('click', () => {
        extentFilter(isFilterExtended);
        isFilterExtended = !isFilterExtended;
    });


    /**
     * Function triggered when the window width changes, in order to define the position of the filter and if it can be extended
     */
    function filterWindowResize() {
        if (windowWidth < 1000) {
            extentFilter(true);
            allowFilterExtend = true;
            $('#nav-arrow').show();
        } else {
            extentFilter(false);
            allowFilterExtend = false;
            $('#nav-arrow').hide();
        }
        isFilterExtended = <number>$('nav').width() < 100;
    }


    /**
     * Extend of collapse the filter
     * @param extend `true` to extend, `false` to collapse
     */
    function extentFilter(extend: boolean): void {
        if (!allowFilterExtend) return;
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
        let isDefault = defaultFilterValues[filterName].default === filterValue;

        if (isDefault)
            delete searchFilters[filterName];
        else
            searchFilters[filterName] = filterValue;

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
        delete searchFilters.search;
        $.each(searchFilters, (key: string, value) => {
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

    let flowBrowserOffset = 0;
    let flowBrowserFlows: Flow[] = [];

    if (!searchFilters.search)
        queryTopFlows(<string>searchFilters.sort);
    else
        querySearchFlow(searchFilters.search);

    let flowsRequestData: Flow[];
    let flowContainerList = $('#flow-list-container');


    /**
     * Query the flows and display them in the flow container list
     * @param queryMode `new` or `null` for the top new, `rated` for the top rated
     */
    function queryTopFlows(queryMode?: string) {

        let data: any = { offset: flowBrowserOffset };

        if (queryMode === 'rated')
            data['rated'] = 1;

        $.ajax({
            type: 'GET',
            url: `${flowshareURLs.api}flows.php`,
            data: data,
            timeout: 5000,
            success: (data: string) => {

                if (!decodeBrowserRequestData(data))
                    return;
                let reqData = <Flow[]>decodeBrowserRequestData(data);

                flowBrowserFlows = [ ...flowBrowserFlows, ...reqData ];
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
            url: `${flowshareURLs.api}search.php`,
            data: {
                text: str,
                offset: flowBrowserOffset,
            },
            timeout: 5000,
            success: (data: string) => {

                if (!decodeBrowserRequestData(data))
                    return;
                let reqData = <Flow[]>decodeBrowserRequestData(data);

                flowBrowserFlows = [ ...flowBrowserFlows, ...reqData ];
                const resultCount: number = flowBrowserFlows.length;
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

        if (reqData.error && flowBrowserFlows.length === 0) {
            flowContainerList.prepend('<i class="fas fa-chevron-circle-left back-arrow" id="flow-search-back-arrow" style="top: 5px; left: 5px"></i>');
            flowSearchBackArrowPress();
            $('#flows-loading').html(`Error: ${reqData.error}`);
            return false;
        }

        return reqData;

    }

    function displayFlowsList(header?: string, showBackButton?: boolean) {

        let data: Flow[] = flowBrowserFlows;

        flowsRequestData = data;

        flowContainerList.text('');

        if (header) {

            let backButton = showBackButton ? '<i class="fas fa-chevron-circle-left back-arrow" id="flow-search-back-arrow"></i>' : '';

            flowContainerList.append(
                $(`<div class="header">${backButton}${header}</div><hr>`),
            );

            if (showBackButton) flowSearchBackArrowPress();

        }

        $.each(data, function (index, value: any) {

            flowContainerList.append(
                $('<div class="flow-container"></div>').attr({
                    'data-flow-id': value['id'],
                    'data-flow-index': index,
                }).append(
                    $('<div class="flow-title"></div>').text(value['title']),
                    $('<div class="flow-author"></div>').text(value['user']),
                    $('<div class="flow-description"></div>').text(value['description']),
                    $('<div class="flow-downloads"></div>')
                        .append($('<i class="fas fa-download"></i>')
                            .append($('<span class="number-container"></span>').text(value['downloads']),
                            ),
                        ),
                    $('<div class="flow-rating"></div>')
                        .append($('<i class="far fa-star"></i>')
                            .append($('<span class="number-container"></span>').text(value['ratings']),
                            ),
                        ),
                ),
            );

            $('.flow-container:odd').css('backgroundColor', '#E5E5E5');

            triggerFlowContainerClick();

        });

        footerWindowResize();   // change the footer position

    }


    // ----- Scroll updates -----

    let scrollingUpdate = false;

    body.on('scroll', () => {

        let remainScroll = body.prop('scrollHeight') - <number>body.height() - <number>body.scrollTop();

        if (remainScroll < 200 && !scrollingUpdate) {

            flowBrowserOffset = 15;

            if (!searchFilters.search)
                queryTopFlows(<string>searchFilters.sort);
            else
                querySearchFlow(<string>searchFilters.search);

            scrollingUpdate = true;

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
            let flowData = flowsRequestData[flowIndex];

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
            .html('')
            .append(
                '<i class="fas fa-chevron-circle-left back-arrow" id="full-flow-data-back-arrow"></i>',
                $('<div class="flow-title"></div>').text(flowData['title']),
                $('<div class="flow-author"></div>').text(flowData['user']),
                $('<div class="flow-description"></div>').text(flowData['description']),
                $('<div id="flow-data-bar" style="margin-bottom: 20px"></div>').append(
                    $('<div></div>').append(
                        $('<i class="fas fa-download"></i>').append(
                            $('<span class="number-container"></span>').text(flowData['downloads']),
                        ),
                    ),
                    $('<div></div>').append(
                        $('<i class="far fa-star"></i>').append(
                            $('<span class="number-container"></span>').text(flowData['ratings']),
                        ),
                    ),
                    '<div id="download-button"><i class="fas fa-file-download" style="margin-right: 5px"></i>Download</div>',
                    '<div style="float: none" id="review-button"><i class="fas fa-user-plus" style="margin-right: 5px"></i>Add review</div>',
                ),
            )
            .css('opacity', 1)
            .css('pointerEvents', 'all');


        // manage download button

        $('#download-button').off('click.flowshare').on('click.flowshare', () => {
            downloadFlow(flowID, flowData['title']);
        });
        flowDataWindowResize();

        // manage review button
        $('#review-button').on('click', function (e) {

        });

        // manage flow list

        flowContainerList.css('opacity', 0);
        if (windowWidth < 1000) $('nav').css('opacity', 0);
        body.css('pointerEvents', 'none');
        $('header').css('pointerEvents', 'all');

        flowBackArrowClick();

        // query flow ratings

        $.ajax({
            url: `${flowshareURLs.api}reviews.php?view&id=${flowID}`,
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

        // update url

        searchFilters['id'] = <string>flowID;
        applyFilters(false);

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
                body
                    .css('pointerEvents', 'all');
                $('#flow-data')
                    .css('opacity', 0)
                    .css('pointerEvents', 'none')
                    .html('');
                delete searchFilters.id;
                applyFilters(false);
            });

    }


    /**
     * Function triggered when the window width changes on the full flow data display, in order to fix a margin bug for the review button
     */
    function flowDataWindowResize() {

        // fix margin bug with review button
        let reviewButton = $('#review-button');

        if (windowWidth < 900 || (windowWidth > 1000 && windowWidth < 1350))
            reviewButton.css('left', '6%');
        else
            reviewButton.css('left', '0');


    }


    /**
     * Display the reviews of a flow at the bottom of the full flow data
     * @param data the ratings data, `null` if an error
     * @param error the error message to display (if there is one)
     */
    function displayFlowReviews(data: FlowReview[] | null, error?: string) {

        if (data === null) return;

        let flowData = $('#flow-data');

        if (error)
            flowData.append(
                $(`<div class="rating-container">JSON Parsing error<br>Response body:<br>${error}</div>`),
            );

        if (body.css('pointerEvents') === 'none' && data.length > 0) {

            flowData.append(
                $('<div style="position: relative; margin: 20px; font-size: 25px; font-weight: 600">Ratings</div>'),
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
            url: `${flowshareURLs.api}flows.php/id/${id}?data&base64`,
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
                alert(`Download error : ${e}`);
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
        const flowContainerBottom: number = flowContainerList.position().top + (flowContainerList.height() || 0) + 100;
        const bottomContainer: number = Math.max(filterBottom, flowContainerBottom);

        // set the footer position
        if (bottomContainer < windowHeight - 85)
            footerDiv.css({
                position: 'absolute',
            });
        else
            footerDiv.css({
                position: 'relative',
            });

    }

});
