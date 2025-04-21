so here is result report in my supabase

[
  {
    "id": "321eb8ff-752a-4e1f-8a78-6e96db0aa35b",
    "user_id": "39007684-055b-47e0-9ca9-fd373626f2f6",
    "type": "weekly",
    "start_date": "2025-04-13",
    "end_date": "2025-04-19",
    "summary": "<p>sdfsdf</p>",
    "next_goals": "<p>sdf</p>",
    "comments": "",
    "metrics_summary": {},
    "reviewed": false,
    "quantity_rating": null,
    "quality_rating": null,
    "created_at": "2025-04-19 05:29:49.535+00",
    "updated_at": "2025-04-19 05:29:49.535+00"
  }
]

here is daily report
[
  {
    "id": "3badea26-a9b8-41ca-932f-e7d7599e4559",
    "user_id": "39007684-055b-47e0-9ca9-fd373626f2f6",
    "date": "2025-04-20",
    "metrics_data": {
      "c624292d-1d2a-4a24-81a5-26d5190a4114": {
        "fact": 5,
        "plan": 50
      },
      "f65c1f25-bd17-417d-8c29-8c6fdadade08": {
        "fact": 1,
        "plan": 5
      }
    },
    "today_notes": "<ul data-type=\"taskList\"><li data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"></label><div><p>1</p></div></li><li data-checked=\"true\"><label><input type=\"checkbox\" checked=\"checked\"></label><div><p>2</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>3</p></div></li></ul>",
    "tomorrow_notes": "<ul data-type=\"taskList\"><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>4</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>5</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>6</p></div></li></ul>",
    "general_comments": "<p></p>",
    "created_at": "2025-04-19 14:49:09.923824+00",
    "updated_at": "2025-04-19 14:49:09.923824+00"
  },
  {
    "id": "51769dea-0243-44c7-991e-08d4b394458e",
    "user_id": "39007684-055b-47e0-9ca9-fd373626f2f6",
    "date": "2025-04-19",
    "metrics_data": {
      "c624292d-1d2a-4a24-81a5-26d5190a4114": {
        "fact": 1,
        "plan": 50
      },
      "f65c1f25-bd17-417d-8c29-8c6fdadade08": {
        "fact": 1,
        "plan": 5
      }
    },
    "today_notes": "<ul data-type=\"taskList\"><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>1</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>2</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>3</p></div></li></ul>",
    "tomorrow_notes": "<p>dadsddertret</p>",
    "general_comments": "<p></p>",
    "created_at": "2025-04-19 14:50:05.73606+00",
    "updated_at": "2025-04-19 14:50:05.73606+00"
  },
  {
    "id": "7ab2a11f-adac-4414-a2f3-ef834e788c47",
    "user_id": "39007684-055b-47e0-9ca9-fd373626f2f6",
    "date": "2025-04-21",
    "metrics_data": {
      "86a96a27-560c-40a9-880a-a837b4c0d851": {
        "fact": 1,
        "plan": 0
      },
      "f65c1f25-bd17-417d-8c29-8c6fdadade08": {
        "fact": 1,
        "plan": 5
      }
    },
    "today_notes": "<ul data-type=\"taskList\"><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>1</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>2</p></div></li><li data-checked=\"false\"><label><input type=\"checkbox\"></label><div><p>3</p><p></p></div></li></ul>",
    "tomorrow_notes": "<p>dadsddertret</p><p>f</p><p>f</p><p>f</p>",
    "general_comments": "<p></p>",
    "created_at": "2025-04-21 18:20:40.950503+00",
    "updated_at": "2025-04-21 18:20:40.950503+00"
  }
]

i want show in my result report view

1. Not a one date as in daily report but date range in format Apr 1 – Oct 25
2. week or month flag 



