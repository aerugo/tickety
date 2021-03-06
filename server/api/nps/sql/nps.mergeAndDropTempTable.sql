SET XACT_ABORT ON

BEGIN TRAN

/****************************
 * Merge the NPS table first
 ****************************/
INSERT INTO [dbo].[NPSSurveyResult] (
    [npsDate]
  , [npsTel]
  , [npsScore]
  , [ticketId]
  , [zendeskId]
  , [npsComment]
  , [npsFollowUp]
  , [serviceName]
  , [shortcode]
)
SELECT
    [npsDate]
  , [npsTel]
  , [npsScore]
  , [ticketId]
  , [zendeskId]
  , [npsComment]
  , [npsFollowUp]
  , [serviceName]
  , [shortcode]
FROM (
  MERGE [dbo].[NPSSurveyResult] AS [Target]
  USING (
    SELECT
        CAST([npsDate] AS Date) AS [npsDate]
      , [npsTel] AS [npsTel]
      , MAX([npsScore]) AS [npsScore]
      , MIN([ticketId]) AS [ticketId]
      , MIN([zendeskId]) AS [zendeskId]
      , MAX([npsComment]) AS [npsComment]
      , MAX([npsFollowUp]) AS [npsFollowUp]
      , MAX([serviceName]) AS [serviceName]
      , MAX([shortcode]) AS [shortcode]
    FROM [dbo].[{tablename}]
    GROUP BY [npsTel], CAST([npsDate] AS date)
  ) AS [Source]
  ON
      -- Match on npsTel and the date part of npsDate
      [Target].[npsTel] = [Source].[npsTel]
    AND CAST([Target].[npsDate] AS date) = CAST([Source].[npsDate] AS date)

    WHEN MATCHED AND (
        (
            [Target].[npsScore] != [Source].[npsScore]
        OR  ([Target].[npsScore] IS NULL AND [Source].[npsScore] IS NOT NULL)
        )
     OR (
            [Target].[npsComment] != [Source].[npsComment]
        OR  ([Target].[npsComment] IS NULL AND [Source].[npsComment] IS NOT NULL)
        )
     OR (
            [Target].[npsFollowUp] != [Source].[npsFollowUp]
        OR  ([Target].[npsFollowUp] IS NULL AND [Source].[npsFollowUp] IS NOT NULL)
        )
     OR (
          [Target].[ticketId] != [Source].[ticketId]
       OR ([Target].[ticketId] IS NULL AND [Source].[ticketId] IS NOT NULL)
        )
     OR (
          [Target].[zendeskId] != [Source].[zendeskId]
       OR ([Target].[zendeskId] IS NULL AND [Source].[zendeskId] IS NOT NULL)
        )
    )
    THEN UPDATE SET
        [Target].[npsScore] = [Source].[npsScore]
      , [Target].[npsComment] = [Source].[npsComment]
      , [Target].[npsFollowUp] = [Source].[npsFollowUp]
      , [Target].[ticketId] = [Source].[ticketId]
      , [Target].[zendeskId] = [Source].[zendeskId]
      , [Target].[serviceName] = [Source].[serviceName]
      , [Target].[shortcode] = [Source].[shortcode]
      , [Target].[isLocal] = NULL
      , [Target].[dateChanged] = GETUTCDATE()

    WHEN NOT MATCHED BY TARGET
        THEN INSERT (
            [npsDate]
          , [npsTel]
          , [npsScore]
          , [npsComment]
          , [npsFollowUp]
          , [ticketId]
          , [zendeskId]
          , [serviceName]
          , [shortcode]
        )
        VALUES (
            [Source].[npsDate]
          , [Source].[npsTel]
          , [Source].[npsScore]
          , [Source].[npsComment]
          , [Source].[npsFollowUp]
          , [Source].[ticketId]
          , [Source].[zendeskId]
          , [Source].[serviceName]
          , [Source].[shortcode]
        )

    OUTPUT $action AS [Action], [Source].*
) AS [MergeOutput]
 WHERE [MergeOutput].[Action] = NULL

/****************************
 * Insert the callback answers with a score of 7 or 8
 ****************************/
INSERT INTO [dbo].[CallBack] (
    [npsId]
  , [callBackStatus]
  , [isClosed]
  , [dateClosed]
)
SELECT
    [npsId]
  , 'No call back needed'
  , 1
  , GETUTCDATE()
FROM (
  SELECT [_NPS].[npsId] AS [npsId]
  FROM [dbo].[NPSSurveyResult] AS [_temp_]

  LEFT JOIN [dbo].[NPSSurveyResult] AS [_NPS]
  ON [_NPS].[npsTel] = [_temp_].[npsTel]
    AND [_NPS].[npsDate] = [_temp_].[npsDate]

  WHERE 1=1
    AND [_temp_].[npsScore] IN (7, 8)
    AND [_NPS].[npsId] NOT IN (
      SELECT [npsId]
      FROM [dbo].[CallBack]
      WHERE [npsId] IS NOT NULL
    )
) AS [_data_]

-- Drop the temp table
DROP TABLE [dbo].[{tablename}]

COMMIT TRAN
