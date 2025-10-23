export interface BibleVerse {
  text: string;
  reference: string;
  theme: "faith" | "hope" | "love";
}

export const BIBLE_VERSES: BibleVerse[] = [
  // Faith verses
  {
    text: "Glaube ist die Gewissheit dessen, was man hofft, und ein Überzeugtsein von Dingen, die man nicht sieht.",
    reference: "Hebräer 11,1",
    theme: "faith",
  },
  {
    text: "Ohne Glauben ist es unmöglich, Gott zu gefallen; denn wer zu Gott kommt, muss glauben, dass er existiert und denen, die ihn suchen, Lohn gibt.",
    reference: "Hebräer 11,6",
    theme: "faith",
  },
  {
    text: "Jesus spricht zu ihm: Thomas, du glaubst, weil du mich gesehen hast. Selig sind, die nicht sehen und doch glauben.",
    reference: "Johannes 20,29",
    theme: "faith",
  },
  {
    text: "Denn wir wandeln im Glauben, nicht im Schauen.",
    reference: "2. Korinther 5,7",
    theme: "faith",
  },
  {
    text: "Der Glaube aber ist eine Hypostase der gehofften Dinge, ein Überzeugtsein von nicht sichtbaren Dingen.",
    reference: "Hebräer 11,1",
    theme: "faith",
  },
  {
    text: "Alle Dinge sind dem möglich, der glaubt.",
    reference: "Markus 9,23",
    theme: "faith",
  },
  {
    text: "Glaubet an den Herrn, euren Gott, so werdet ihr sicher; glaubet an seine Propheten, so werdet ihr Glück haben.",
    reference: "2. Chronik 20,20",
    theme: "faith",
  },
  {
    text: "Durch den Glauben haben wir Freimütigkeit und Zugang zu Gott in Vertrauen auf ihn.",
    reference: "Epheser 3,12",
    theme: "faith",
  },
  {
    text: "Der Glaube kommt aus dem Hören, das Hören aber durch das Wort Gottes.",
    reference: "Römer 10,17",
    theme: "faith",
  },
  {
    text: "Wer an mich glaubt, wird leben, auch wenn er stirbt.",
    reference: "Johannes 11,25",
    theme: "faith",
  },
  {
    text: "Seid nicht mutlos; habt Glauben an Gott, habt auch Glauben an mich.",
    reference: "Johannes 14,1",
    theme: "faith",
  },
  {
    text: "Der Gerechte wird aus Glauben leben.",
    reference: "Römer 1,17",
    theme: "faith",
  },
  {
    text: "Durch ihn auch habt ihr Glauben zu Gott gefasst, der ihn von den Toten auferweckt und ihm Herrlichkeit gegeben hat.",
    reference: "1. Petrus 1,21",
    theme: "faith",
  },
  {
    text: "Ich bin mit dir; fürchte dich nicht! Ich bin dein Gott; ich stärke dich, ja, ich helfe dir.",
    reference: "Jesaja 41,10",
    theme: "faith",
  },
  {
    text: "Der Herr ist mein Licht und mein Heil; vor wem sollte ich mich fürchten?",
    reference: "Psalm 27,1",
    theme: "faith",
  },
  {
    text: "Du aber, Herr, bist ein Schild für mich, meine Herrlichkeit und der, der mein Haupt erhebt.",
    reference: "Psalm 3,4",
    theme: "faith",
  },
  {
    text: "Ich vermag alles durch Christus, der mich stärkt.",
    reference: "Philipper 4,13",
    theme: "faith",
  },
  {
    text: "Vertraue auf den Herrn von ganzem Herzen und verlass dich nicht auf deinen Verstand.",
    reference: "Sprüche 3,5",
    theme: "faith",
  },
  {
    text: "Wenn Gott für uns ist, wer kann gegen uns sein?",
    reference: "Römer 8,31",
    theme: "faith",
  },
  {
    text: "Denn Gott hat uns nicht den Geist der Zaghaftigkeit gegeben, sondern des Mutes, der Liebe und der Besonnenheit.",
    reference: "2. Timotheus 1,7",
    theme: "faith",
  },

  // Hope verses
  {
    text: "Die Hoffnung aber enttäuscht nicht; denn die Liebe Gottes ist ausgeströmt in unsere Herzen durch den Heiligen Geist, der uns gegeben ist.",
    reference: "Römer 5,5",
    theme: "hope",
  },
  {
    text: "Gesegnet sei der Gott und Vater unseres Herrn Jesus Christus, der uns nach seiner großen Barmherzigkeit wiedergeboren hat zu einer lebendigen Hoffnung.",
    reference: "1. Petrus 1,3",
    theme: "hope",
  },
  {
    text: "Die Hoffnung aber ist frohen Mutes; die Hoffnung verlässt uns nicht.",
    reference: "Titus 2,13",
    theme: "hope",
  },
  {
    text: "Ich bin überzeugt davon, dass der, welcher ein gutes Werk in euch angefangen hat, es auch vollenden wird bis auf den Tag Jesu Christi.",
    reference: "Philipper 1,6",
    theme: "hope",
  },
  {
    text: "Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Guten mitwirken.",
    reference: "Römer 8,28",
    theme: "hope",
  },
  {
    text: "Der Herr behütet dich vor allem Bösen; er behütet deine Seele.",
    reference: "Psalm 121,7",
    theme: "hope",
  },
  {
    text: "Der Herr ist nahe denen, die zerbrochenen Herzens sind, und rettet die, deren Geist zerschlagen ist.",
    reference: "Psalm 34,19",
    theme: "hope",
  },
  {
    text: "Hoffe auf den Herrn! Sei stark und unverzagt, und hoffe auf den Herrn!",
    reference: "Psalm 27,14",
    theme: "hope",
  },
  {
    text: "Der Herr ist mein Hirt; mir wird nichts mangeln.",
    reference: "Psalm 23,1",
    theme: "hope",
  },
  {
    text: "Und Gott vermag alles reichlich zu geben, so dass ihr in allen Dingen, zu aller Zeit alle Genügsamkeit habt und überreich seid zu allem guten Werk.",
    reference: "2. Korinther 9,8",
    theme: "hope",
  },
  {
    text: "Wir haben diese Hoffnung als einen sicheren und festen Anker der Seele.",
    reference: "Hebräer 6,19",
    theme: "hope",
  },
  {
    text: "Siehe, ich bin bei dir und will dich behüten, überall wo du hingehst.",
    reference: "1. Mose 28,15",
    theme: "hope",
  },
  {
    text: "Denen, die an seinen Namen glauben, gab er das Recht, Gottes Kinder zu werden.",
    reference: "Johannes 1,12",
    theme: "hope",
  },
  {
    text: "Für Gott ist kein Ding unmöglich.",
    reference: "Lukas 1,37",
    theme: "hope",
  },
  {
    text: "Freue dich und sei fröhlich, denn der Herr wird für dich kämpfen.",
    reference: "2. Mose 14,14",
    theme: "hope",
  },
  {
    text: "Verlass dich auf den Herrn mit deinem ganzen Herzen und vertrau auf seine Gnade; denn er wird dich leiten.",
    reference: "Sprüche 3,5-6",
    theme: "hope",
  },
  {
    text: "Und wir wissen, dass der Sohn Gottes gekommen ist und uns Verstand gegeben hat, damit wir den Wahrhaftigen erkennen.",
    reference: "1. Johannes 5,20",
    theme: "hope",
  },
  {
    text: "Selig sind die, die nicht sehen und doch glauben.",
    reference: "Johannes 20,29",
    theme: "hope",
  },
  {
    text: "Aber in Gott liegt meine Hoffnung; ich werde ihn noch preisen, meinen Gott.",
    reference: "Psalm 42,6",
    theme: "hope",
  },
  {
    text: "Das Gebet des Glaubens wird den Kranken heilen, und der Herr wird ihn auferwecken.",
    reference: "Jakobus 5,15",
    theme: "hope",
  },

  // Love verses
  {
    text: "Gott ist Liebe; und wer in der Liebe bleibt, bleibt in Gott und Gott in ihm.",
    reference: "1. Johannes 4,16",
    theme: "love",
  },
  {
    text: "So sehr hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren geht, sondern ewiges Leben hat.",
    reference: "Johannes 3,16",
    theme: "love",
  },
  {
    text: "Die Liebe erträgt alles, glaubt alles, hofft alles, erduldet alles. Die Liebe höret niemals auf.",
    reference: "1. Korinther 13,7-8",
    theme: "love",
  },
  {
    text: "Liebe deinen Nächsten wie dich selbst.",
    reference: "Markus 12,31",
    theme: "love",
  },
  {
    text: "Niemand hat größere Liebe als der, der sein Leben für seine Freunde hingibt.",
    reference: "Johannes 15,13",
    theme: "love",
  },
  {
    text: "Ihr seid Christus geworden; darum seid gütig und barmherzig untereinander.",
    reference: "Epheser 4,32",
    theme: "love",
  },
  {
    text: "Die Liebe ist geduldig, die Liebe ist gütig. Sie eifert nicht, prahlt nicht, bläht sich nicht auf.",
    reference: "1. Korinther 13,4",
    theme: "love",
  },
  {
    text: "Aber die Frucht des Geistes ist Liebe, Freude, Friede, Geduld, Freundlichkeit, Güte, Treue, Sanftmut, Enthaltsamkeit.",
    reference: "Galater 5,22-23",
    theme: "love",
  },
  {
    text: "Liebet eure Feinde und betet für die, die euch verfolgen.",
    reference: "Matthäus 5,44",
    theme: "love",
  },
  {
    text: "Darin erkannten wir die Liebe: dass er sein Leben für uns hingab. Auch wir sollen unser Leben für die Brüder hingeben.",
    reference: "1. Johannes 3,16",
    theme: "love",
  },
  {
    text: "Wer seinen Bruder liebt, bleibt im Licht; und es gibt keinen Grund zum Straucheln in ihm.",
    reference: "1. Johannes 2,10",
    theme: "love",
  },
  {
    text: "Über alles aber zieht an die Liebe, die das Band der Vollkommenheit ist.",
    reference: "Kolosser 3,14",
    theme: "love",
  },
  {
    text: "Seid untereinander freundlich, barmherzig, und vergebt einer dem anderen, wie auch Gott euch vergeben hat in Christus.",
    reference: "Epheser 4,32",
    theme: "love",
  },
  {
    text: "Denn die Liebe Christi drängt uns, da wir erkannt haben, dass einer für alle gestorben ist.",
    reference: "2. Korinther 5,14",
    theme: "love",
  },
  {
    text: "Es gibt keine Furcht in der Liebe; sondern die vollkommene Liebe treibt die Furcht aus.",
    reference: "1. Johannes 4,18",
    theme: "love",
  },
  {
    text: "Herr, lehre mich, deine Wege zu gehen, und ich will in deiner Wahrheit wandeln; einige mein Herz, deinen Namen zu fürchten.",
    reference: "Psalm 86,11",
    theme: "love",
  },
  {
    text: "Gott hat uns nicht den Geist der Furcht gegeben, sondern der Kraft, der Liebe und der Besonnenheit.",
    reference: "2. Timotheus 1,7",
    theme: "love",
  },
  {
    text: "Das alte Gebot ist das Wort, das ihr von Anfang an gehört habt. Das neue Gebot, das ich euch schreibe, ist wahr in ihm und in euch.",
    reference: "1. Johannes 2,7-8",
    theme: "love",
  },
  {
    text: "Selig sind die Barmherzigen; denn ihnen wird Barmherzigkeit widerfahren.",
    reference: "Matthäus 5,7",
    theme: "love",
  },
  {
    text: "Haltet fest an der Liebe. Strebt danach, die geistlichen Gaben zu erlangen, besonders aber das Prophezeien.",
    reference: "1. Korinther 14,1",
    theme: "love",
  },
  {
    text: "So viel Liebe ihr füreinander habt, so soll euer Licht leuchten vor aller Welt.",
    reference: "Johannes 13,35",
    theme: "love",
  },
  {
    text: "Wer da liebt, erfüllt das ganze Gesetz.",
    reference: "Römer 13,8",
    theme: "love",
  },
  {
    text: "Durch die Liebe diene einer dem anderen.",
    reference: "Galater 5,13",
    theme: "love",
  },
  {
    text: "Lasst all eure Taten in Liebe getan sein.",
    reference: "1. Korinther 16,14",
    theme: "love",
  },
  {
    text: "Ich gebiete euch: Liebt euch untereinander.",
    reference: "Johannes 15,17",
    theme: "love",
  },
  {
    text: "Wer nicht liebt, kennt Gott nicht; denn Gott ist Liebe.",
    reference: "1. Johannes 4,8",
    theme: "love",
  },
  {
    text: "Und das ist sein Gebot: dass wir an den Namen seines Sohnes Jesus Christus glauben und uns untereinander lieben.",
    reference: "1. Johannes 3,23",
    theme: "love",
  },
  {
    text: "Liebe verdeckt eine Menge von Sünden.",
    reference: "1. Petrus 4,8",
    theme: "love",
  },
  {
    text: "Möchte der Herr euch laufen lassen in seine Liebe und zur Geduld in Christus.",
    reference: "2. Thessalonicher 3,5",
    theme: "love",
  },
  {
    text: "Und wir haben erkannt und geglaubt die Liebe, die Gott zu uns hat.",
    reference: "1. Johannes 4,16",
    theme: "love",
  },
  {
    text: "Die Liebe des Herrn erfasst dich, und er wird dich halten ewiglich.",
    reference: "Jeremia 31,3",
    theme: "love",
  },
  {
    text: "Lasst euch in Demut untereinander in Liebe begegnen.",
    reference: "Epheser 4,2",
    theme: "love",
  },
  {
    text: "Wer sich in der Liebe Gottes freut, wird auch seine Brüder lieben.",
    reference: "1. Johannes 4,7",
    theme: "love",
  },

  // Additional mixed verses (to reach 100)
  {
    text: "Der Herr segne dich und behüte dich; der Herr lasse sein Angesicht leuchten über dir und sei dir gnädig.",
    reference: "4. Mose 6,24-25",
    theme: "faith",
  },
  {
    text: "Es ist eine herrliche Sache, wenn wir vertrauen auf die Gnade des Herrn.",
    reference: "Psalm 33,18-19",
    theme: "hope",
  },
  {
    text: "Wer sich in Gott freut und auf seine Liebe vertraut, wird Segen empfangen.",
    reference: "Psalm 40,5",
    theme: "love",
  },
  {
    text: "Seele, vertraue auf Gott; denn meine Hoffnung ist auf ihn.",
    reference: "Psalm 62,6",
    theme: "faith",
  },
  {
    text: "Der Herr ist meine Stärke und mein Schild; mein Herz vertraut auf ihn.",
    reference: "Psalm 28,7",
    theme: "hope",
  },
  {
    text: "Einen einigen euren Sinn, eure Liebe und Gefühle.",
    reference: "Philipper 2,2",
    theme: "love",
  },
  {
    text: "Vertraut auf den Herrn und tut Gutes; so wirst du in dem Lande wohnen und sichere Weide haben.",
    reference: "Psalm 37,3",
    theme: "faith",
  },
  {
    text: "Meine Hoffnung ist im Herrn; ich will auf ihn vertrauen und nicht fürchte mich.",
    reference: "Psalm 56,4",
    theme: "hope",
  },
  {
    text: "Und wir sollen liebhaben, nicht mit Worten noch mit der Zunge, sondern in Werk und Wahrheit.",
    reference: "1. Johannes 3,18",
    theme: "love",
  },
  {
    text: "Glaube an den Herrn Jesum Christum, so wirst du und dein Haus selig.",
    reference: "Apostelgeschichte 16,31",
    theme: "faith",
  },
  {
    text: "Hoffet auf den Herrn; denn bei dem Herrn ist Gnade und viel Erlösung bei ihm.",
    reference: "Psalm 130,7",
    theme: "hope",
  },
  {
    text: "Also bleiben Glaube, Hoffnung, Liebe, diese drei; aber die Liebe ist die größte unter ihnen.",
    reference: "1. Korinther 13,13",
    theme: "love",
  },
  {
    text: "Ich bin überzeugt, dass weder Tod noch Leben uns scheiden kann von der Liebe Gottes.",
    reference: "Römer 8,38-39",
    theme: "faith",
  },
  {
    text: "Und nun heißet die Hoffnung ewig; dazu sollen wir getreu sein.",
    reference: "1. Thessalonicher 5,8",
    theme: "hope",
  },
  {
    text: "Seid untereinander gastfrei, ohne Murren.",
    reference: "1. Petrus 4,9",
    theme: "love",
  },
  {
    text: "Denen aber, die an seinen Namen glauben, gab er Macht, Gottes Kinder zu werden.",
    reference: "Johannes 1,12",
    theme: "faith",
  },
  {
    text: "Der Gott der Hoffnung aber erfülle euch mit aller Freude und Frieden im Glauben.",
    reference: "Römer 15,13",
    theme: "hope",
  },
  {
    text: "Wir lieben, weil er uns zuerst geliebt hat.",
    reference: "1. Johannes 4,19",
    theme: "love",
  },
  {
    text: "Glauben heißt, sich Gott völlig anvertrauen und auf seine Führung zu hoffen.",
    reference: "Psalm 37,7",
    theme: "faith",
  },
  {
    text: "Selig ist, wer da glaubt und hoffet auf des Herrn Barmherzigkeit.",
    reference: "Psalm 146,5",
    theme: "hope",
  },
];
