import math, random, os
from PIL import Image, ImageDraw
random.seed(5)
OUT='assets/ui_comps/'  # run from the project root: python3 tools/settings_art.py
S=4
# palette
WD='#4a2a10'; WM='#7a4a1e'; WL='#a46122'; WH='#d9a35a'
PD='#c9a566'; PE='#d9b97a'; PA='#f8e9c8'; PS='#efd9ac'
GD='#24541f'; GM='#3f8a35'; GL='#6fb544'; GH='#a8d868'
FW='#fffdf0'; FS='#e4dcc2'; FY='#f2b73c'
def rgb(c): return tuple(int(c[i:i+2],16) for i in (1,3,5))+(255,)
def save(im,name):
    im=im.resize((im.width*S,im.height*S),Image.NEAREST); im.save(OUT+name); print(name,im.size)
def new(w,h): 
    im=Image.new('RGBA',(w,h),(0,0,0,0)); return im,ImageDraw.Draw(im)
def px(d,x,y,c): d.point((int(x),int(y)),fill=rgb(c) if isinstance(c,str) else c)
def rrect(d,x0,y0,x1,y1,r,fill,outline=None):
    d.rounded_rectangle([x0,y0,x1,y1],radius=r,fill=rgb(fill),outline=rgb(outline) if outline else None)
def leaf(d,cx,cy,ang,ln=7,wd=3):
    pts=[]
    for t in range(0,21):
        a=t/20*math.pi
        x=math.cos(a)*ln/2; y=math.sin(a)*wd/2
        pts.append((x,y))
    for t in range(0,21):
        a=math.pi+t/20*math.pi
        pts.append((math.cos(a)*ln/2, math.sin(a)*wd/2))
    ca,sa=math.cos(ang),math.sin(ang)
    P=[(cx+x*ca-y*sa, cy+x*sa+y*ca) for x,y in pts]
    d.polygon(P,fill=rgb(GM),outline=rgb(GD))
    # light half + midrib
    P2=[(cx+x*ca-y*sa, cy+x*sa+y*ca) for x,y in pts[:21]]
    d.polygon(P2,fill=rgb(GL))
    d.line([(cx-ln/2*ca*0.8,cy-ln/2*sa*0.8),(cx+ln/2*ca*0.8,cy+ln/2*sa*0.8)],fill=rgb(GD))
def flower(d,cx,cy,r=3):
    for k in range(5):
        a=k/5*2*math.pi-math.pi/2
        x=cx+math.cos(a)*r*0.9; y=cy+math.sin(a)*r*0.9
        d.ellipse([x-r*0.6,y-r*0.6,x+r*0.6,y+r*0.6],fill=rgb(FW),outline=rgb(FS))
    d.ellipse([cx-r*0.45,cy-r*0.45,cx+r*0.45,cy+r*0.45],fill=rgb(FY))
def wood(im,d,x0,y0,x1,y1,r=2):
    rrect(d,x0,y0,x1,y1,r,WL,WD)
    rrect(d,x0+1,y0+1,x1-1,y1-1,r,WM)
    # grain
    for y in range(y0+3,y1-2,3):
        for x in range(x0+3,x1-2):
            if random.random()<0.22: px(d,x,y,WL if random.random()<.5 else WM)
    for x in range(x0+2,x1-1): px(d,x,y0+1,WH)
def rope(d,x,y0,y1):
    for y in range(y0,y1):
        px(d,x,y,'#b98a4a' if y%2==0 else '#8a5a28'); px(d,x+1,y,'#6a4018')

# ---------- board ----------
W,H=292,160
im,d=new(W,H)
rrect(d,0,0,W-1,H-1,6,WD)
rrect(d,1,1,W-2,H-2,6,WL)
rrect(d,3,3,W-4,H-4,5,WM)
for x in range(4,W-4): px(d,x,3,WH)
rrect(d,7,7,W-8,H-8,4,PE,PD)
rrect(d,9,9,W-10,H-10,3,PA)
for y in range(10,H-10):
    for x in range(10,W-10):
        n=random.random()
        if n<0.05: px(d,x,y,PS)
# soft inner shade along bottom/right
for i in range(3):
    for x in range(10,W-10): px(d,x,H-11-i,PS)
    for y in range(10,H-10): px(d,W-11-i,y,PS)
save(im,'settings_board.png')

# ---------- title sign ----------
W,H=140,38
im,d=new(W,H)
for x in (28,111): rope(d,x,0,12)
wood(im,d,2,10,W-3,H-3,3)
# decor: leaves + flowers at ends
for (x,y,a) in [(8,12,-2.2),(12,10,-1.2),(W-9,12,-0.9),(W-14,10,-1.9)]: leaf(d,x,y,a,8,4)
flower(d,6,14,3); flower(d,W-6,13,3)
save(im,'settings_title.png')

# ---------- back sign ----------
W,H=64,32
im,d=new(W,H)
for x in (14,48): rope(d,x,0,8)
wood(im,d,2,7,W-3,H-3,3)
leaf(d,W-9,8,-0.9,8,4); flower(d,W-6,9,3)
save(im,'back_sign.png')

# ---------- ribbon (label) ----------
W,H=100,22
im,d=new(W,H)
pts=[(5,3),(W-8,3),(W-8,H-4),(5,H-4),(1,H//2)]
d.polygon(pts,fill=rgb(WD))
pts2=[(6,4),(W-9,4),(W-9,H-5),(6,H-5),(2,H//2)]
d.polygon(pts2,fill=rgb(PE))
d.polygon([(7,5),(W-10,5),(W-10,H-6),(7,H-6),(4,H//2)],fill=rgb('#e8c98a'))
for x in range(7,W-10): px(d,x,5,'#f6e2b0')
leaf(d,W-5,H//2-2,-0.7,9,4); leaf(d,W-4,H//2+3,0.5,8,3)
save(im,'ribbon.png')

# ---------- room name ribbon (small, both leaves) ----------
W,H=84,14
im,d=new(W,H)
rrect(d,6,2,W-7,H-3,4,WD)
rrect(d,7,3,W-8,H-4,3,'#f2dcae')
for x in range(8,W-8): px(d,x,3,'#fff3d4')
for sx,sg in ((3,1),(W-4,-1)):
    leaf(d,sx+sg*1,H//2-2,-0.6*sg-0.3 if sg>0 else -2.5,8,4); leaf(d,sx+sg*1,H//2+3,0.6 if sg>0 else 2.5,7,3)
save(im,'room_ribbon.png')

# ---------- coin plaque ----------
W,H=78,26
im,d=new(W,H)
rrect(d,0,0,W-1,H-1,4,'#2a1608')
rrect(d,1,1,W-2,H-2,4,'#6a3f1a')
rrect(d,2,2,W-3,H-3,3,'#4a2a12')
for x in range(3,W-3): px(d,x,2,'#8a5a28')
save(im,'coin_plaque.png')

# ---------- slots ----------
def slot(name,edge,fill,dash=False,plus=False):
    W,H=34,34
    im,d=new(W,H)
    if dash:
        rrect(d,1,1,W-2,H-2,4,fill)
        for i in range(2,W-3,4):
            for p in ((i,1),(i,H-2),(1,i),(W-2,i)):
                px(d,p[0],p[1],edge); px(d,p[0]+(1 if p[1] in(1,H-2) else 0),p[1]+(0 if p[1] in(1,H-2) else 1),edge)
    else:
        rrect(d,0,0,W-1,H-1,5,edge)
        rrect(d,2,2,W-3,H-3,4,fill)
        for x in range(4,W-4): px(d,x,2,'#fff6e0')
    if plus:
        for k in range(-4,5):
            for t in (0,1):
                px(d,W//2+k,12+t,'#a07a48'); px(d,W//2+t-0,12+k+(0),'#a07a48')
    save(im,name)
slot('slot_tile.png','#e3c488','#f8e3b4')
slot('slot_tile_on.png','#3f7a2e','#e6f0c8')
slot('slot_none.png','#c8a468','#f8e9c8',dash=True,plus=True)

# ---------- next arrow button ----------
W,H=22,28
im,d=new(W,H)
wood(im,d,1,1,W-2,H-2,4)
for k in range(6):
    px(d,8+k//2*1+ (0), 8+k,'#fff3d4'); px(d,9+(k if k<3 else 5-k),8+k,'#fff3d4')
d.line([(8,8),(13,14),(8,20)],fill=rgb('#fff3d4'),width=2)
save(im,'next_btn.png')

# ---------- divider with paw ----------
W,H=200,10
im,d=new(W,H)
for x in range(2,W-2,4):
    if abs(x-W//2)>9: px(d,x,5,'#c8a468'); px(d,x+1,5,'#c8a468')
cx,cy=W//2,5
d.ellipse([cx-3,cy-1,cx+3,cy+3],fill=rgb('#a86a30'))
for dx,dy in [(-4,-2),(-1,-4),(2,-4),(5,-2)]: d.ellipse([cx+dx-1,cy+dy-1,cx+dx+1,cy+dy+1],fill=rgb('#a86a30'))
save(im,'divider_paw.png')

# ---------- vines ----------
def vine(name,flip):
    W,H=30,150
    im,d=new(W,H)
    pts=[]
    for y in range(0,H):
        x=W/2+math.sin(y/9.0)*7
        pts.append((x,y)); px(d,x,y,GD); px(d,x+1,y,GM)
    for i,(x,y) in enumerate(pts):
        if i%7==3:
            side=1 if (i//9)%2==0 else -1
            leaf(d,x+side*5,y,(-0.5 if side>0 else -2.6),12,6)
        if i%27==13: flower(d,x+(-6 if (i//27)%2 else 6),y,3)
    if flip: im=im.transpose(Image.FLIP_LEFT_RIGHT)
    save(im,name)
vine('vine_left.png',False); vine('vine_right.png',True)

# ---------- plant pot with flowers ----------
W,H=40,48
im,d=new(W,H)
for (x,y,a) in [(14,20,-2.6),(26,20,-0.5),(10,14,-2.2),(30,14,-1.0),(20,10,-1.57),(16,26,-3.0),(24,26,0.0)]: leaf(d,x,y,a,14,7)
for (x,y) in [(12,10),(26,8),(33,18),(8,20),(20,4)]: flower(d,x,y,3)
d.polygon([(9,30),(31,30),(28,47),(12,47)],fill=rgb('#a8552a'),outline=rgb('#6a3014'))
d.rectangle([7,28,33,32],fill=rgb('#c0683a'),outline=rgb('#6a3014'))
for x in range(9,31): px(d,x,29,'#d9824a')
save(im,'deco_plant.png')

# ---------- crate + watering can ----------
W,H=48,44
im,d=new(W,H)
# can
d.rectangle([14,6,32,24],fill=rgb('#2f7f86'),outline=rgb('#144a50'))
d.rectangle([15,7,20,23],fill=rgb('#4aa0a8'))
d.polygon([(32,12),(42,6),(44,8),(33,18)],fill=rgb('#2f7f86'),outline=rgb('#144a50'))
d.ellipse([40,3,46,9],fill=rgb('#4aa0a8'),outline=rgb('#144a50'))
d.arc([8,6,18,20],90,270,fill=rgb('#144a50'),width=2)
d.ellipse([16,4,30,9],fill=rgb('#144a50'))
# crate
wood(im,d,2,22,W-3,H-3,2)
d.line([(3,32)] + [(W-4,32)],fill=rgb(WD))
d.line([(3,22)]+[(W-4,22)],fill=rgb(WH))
leaf(d,6,24,-2.4,9,4); flower(d,5,25,3); leaf(d,W-7,24,-0.7,9,4); flower(d,W-6,24,3)
save(im,'deco_crate.png')
