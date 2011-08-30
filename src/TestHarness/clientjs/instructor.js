"use strict";

var constants = require('./common/Constants'),
    util = require('./common/Utilities');

$(document).ready(function ()
{
    var here = window.location.pathname;
    if (here.charAt(here.length-1) != '/')
    {
        here = here + '/';
    }
    
    $('a.button').button();
    
    $('#csv-upload-dialog').dialog({
        autoOpen: false,
        width: 400,
        height: 400,
        modal: true,
        buttons: {
            'Cancel': function ()
            {
                $(this).dialog('close');
            },
            'Upload': function ()
            {
                $(this).find('form').submit();
            }
        }
    });
    
    $('#csv-upload-button').button().click(function ()
    {
        $('#csv-upload-dialog').dialog('open');
    });
    
    $('#new-student-dialog').dialog({
        autoOpen: false,
        width: 350,
        height: 400,
        modal: true,
        buttons: {
            'Cancel': function ()
            {
                $(this).dialog('close');
            },
            'Add student': function ()
            {
                submitNewStudent();
            }
        },
        close: function ()
        {
            $(this).find('input').val('');
        },
        open: function ()
        {
            $(this).find('input[name="rosterID"]').focus();
        }
    });
    
    $('#new-student-dialog').keyup(function (e)
    {
        if (e.keyCode == 13)
        {
            submitNewStudent();
            return false;
        }
    });
    
    $('#new-student-button').button().click(function ()
    {
        $('#new-student-dialog').dialog('open');
    });
    
    
    // Table data
    
    function connectGridToDataView(grid, dataView)
    {
        grid.onSort = function (sortCol, sortAsc)
        {
            var field = sortCol.field;
            var sortFun = function (item1, item2)
            {
                var a = item1[field],
                    b = item2[field];
                return util.compare(a, b);
            };
            dataView.sort(sortFun, sortAsc);
        };
        dataView.onRowCountChanged.subscribe(function ()
        {
            grid.updateRowCount();
            grid.render();
        });
        dataView.onRowsChanged.subscribe(function (rows)
        {
            grid.removeRows(rows);
            grid.render();
        });
    }
    
    function formatTimestamp(row, cell, value, columnDef, dataContext)
    {
        return util.dateFormat(value * 1000, 'm/d HH:MM');
    }
    function formatDuration(row, cell, value, columnDef, dataContext)
    {
        return Math.round(value / 1000) + ' s'
    }
    function formatMedal(row, cell, value, columnDef, dataContext)
    {
        var medal = constants.medal.codeToString(value);
        return '<div class="medal ' + medal + '">' + medal + '</div>';
    }
    function formatEndState(row, cell, value, columnDef, dataContext)
    {
        var endState = constants.endState.codeToString(value);
        return '<div class="end-state ' + endState + '">' + endState + '</div>';
    }
    
    var selectedStudentLoginIDs = [];
    var studentDataView = new Slick.Data.DataView();
    var studentGrid = new Slick.Grid($('#student-table'), studentDataView.rows,
        [
            {id:'instructorLoginID', field:'instructorLoginID', name:'Instructor', sortable:true},
            {id:'rosterID', field:'rosterID', name:'Roster ID', sortable:true},
            {id:'firstName', field:'firstName', name:'First Name', sortable:true},
            {id:'lastName', field:'lastName', name:'Last Name', sortable:true},
            {id:'loginID', field:'loginID', name:'Login ID', sortable:true},
            {id:'password', field:'password', name:'Password'},
            {id:'condition', field:'condition', name:'Condition', sortable:true},
            {id:'gameCount', field:'gameCount', name:'Games', sortable:true}
        ],
        {
            forceFitColumns: true
        });
    studentGrid.onSelectedRowsChanged = function ()
    {
        selectedStudentLoginIDs = [];
        var rows = studentGrid.getSelectedRows();
        for (var i = 0; i < rows.length; i++)
        {
            selectedStudentLoginIDs.push(studentDataView.rows[rows[i]].loginID);
        }
        gamesDataView.refresh();
    };
    connectGridToDataView(studentGrid, studentDataView);
    
    var gamesDataView = new Slick.Data.DataView();
    var gamesGrid = new Slick.Grid($('#games-table'), gamesDataView.rows,
        [
            {id:'loginID', field:'loginID', name:'Login ID', sortable:true},
            {id:'condition', field:'condition', name:'Condition', sortable:true},
            {id:'stageID', field:'stageID', name:'Level', sortable:true},
            {id:'questionSetID', field:'questionSetID', name:'Set', sortable:true},
            {id:'score', field:'score', name:'Score', sortable:true, width: 65},
            {id:'medal', field:'medal', name:'Medal', sortable:true, formatter:formatMedal, width:55},
            {id:'elapsedMS', field:'elapsedMS', name:'Duration', sortable:true, formatter:formatDuration, width: 60},
            {id:'endTime', field:'endTime', name:'Date', sortable:true, formatter:formatTimestamp},
            {id:'endState', field:'endState', name:'End', sortable:true, formatter:formatEndState}
        ],
        {
            forceFitColumns: true,
            multiSelect: false
        });
    gamesDataView.setFilter(function (item)
    {
        return (selectedStudentLoginIDs.length == 0 ||
                ~selectedStudentLoginIDs.indexOf(item.loginID));
    });
    gamesGrid.onSelectedRowsChanged = function ()
    {
        var item = gamesDataView.rows[gamesGrid.getSelectedRows()[0]];
        if (item)
        {
            $.get(here + '../output/' + item.dataFile)
            .success(function (data, status, jqXHR)
            {
                $('#games-output').val(jqXHR.responseText);
            })
            .error(makeXHRErrorHandler('Error fetching game output: '));
        }
        else
        {
            $('#games-output').val('');
        }
    };
    connectGridToDataView(gamesGrid, gamesDataView);
    
    // Fetch the table data.
    fetchStudents();
    fetchResults();
    
    function makeXHRErrorHandler(message)
    {
        return function (jqXHR)
        {
            alert(message + jqXHR.responseText);
        };
    }
    
    function fetchStudents(instructorID)
    {
        //$.getJSON(here + instructorID + '/student')
        $.getJSON(here + 'student')
        .success(function (data)
        {
            studentDataView.beginUpdate();
            studentDataView.setItems(data.students);
            studentDataView.endUpdate();
        })
        .error(makeXHRErrorHandler('Error fetching students: '));
    }
    
    function fetchResults()
    {
        $.getJSON(here + 'student/result')
        .success(function (data)
        {
            gamesDataView.beginUpdate();
            gamesDataView.setItems(data.results);
            gamesDataView.endUpdate();
        })
        .error(makeXHRErrorHandler('Error fetching game results: '));
    }
    
    function submitNewStudent()
    {
        $.post(here + 'student', $('#new-student-dialog form').serialize())
            .success(function (data)
            {
                studentDataView.addItem(data.student);
                $('#new-student-dialog').dialog('close');
            })
            .error(function (jqXHR, statusText, errorThrown)
            {
                alert('Error saving student: ' + jqXHR.responseText);
            })
            .complete(function ()
            {
                //unlock();
            });
    }
});
